const { Server, EVENTS } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { prisma } = require('../db/prisma');

class UploadServer {
  constructor() {
    // TUS 서버 설정
    this.datastore = new FileStore({
      directory: './uploads/temp'
    });

    this.server = new Server({
      path: '/api/upload/video/tus',
      datastore: this.datastore,
      namingFunction: this.generateFileName,
      maxSize: 10 * 1024 * 1024 * 1024, // 10GB 최대 크기
      respectForwardedHeaders: true,
      generateUrl: (req, { proto, host, path, id }) => {
        return `${proto}://${host}${path}/${id}`;
      },
      onUploadCreate: async (req, res, upload) => {
        console.log('Upload created:', upload.id);
        
        // 업로드 세션 데이터베이스에 저장
        const metadata = upload.metadata || {};
        await prisma.files.create({
          data: {
            id: upload.id,
            fileName: metadata.filename || 'untitled',
            mimeType: metadata.filetype || 'video/mp4',
            size: upload.size,
            status: 'UPLOADING',
            uploadProgress: 0,
            userId: metadata.userId,
            metadata: JSON.stringify(metadata)
          }
        });
        
        return res;
      },
      onUploadFinish: async (req, res, upload) => {
        console.log('Upload finished:', upload.id);
        
        // 업로드 완료 처리
        await this.processUploadedFile(upload);
        
        return res;
      }
    });

    // 이벤트 리스너 설정
    this.setupEventListeners();
  }

  generateFileName(req) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${randomString}`;
  }

  setupEventListeners() {
    // 업로드 진행률 추적
    this.server.on(EVENTS.POST_RECEIVE, async (req, res, upload) => {
      const progress = (upload.offset / upload.size) * 100;
      
      // 진행률 업데이트
      await prisma.files.update({
        where: { id: upload.id },
        data: {
          uploadProgress: Math.round(progress),
          uploadedSize: upload.offset
        }
      });

      // WebSocket으로 진행률 브로드캐스트 (Socket.io 연동)
      if (global.io) {
        global.io.to(`upload:${upload.id}`).emit('upload:progress', {
          uploadId: upload.id,
          progress: progress,
          uploadedSize: upload.offset,
          totalSize: upload.size
        });
      }
    });

    // 에러 처리
    this.server.on(EVENTS.POST_TERMINATE, async (req, res, upload) => {
      console.error('Upload terminated:', upload.id);
      
      await prisma.files.update({
        where: { id: upload.id },
        data: { status: 'FAILED' }
      });
    });
  }

  async processUploadedFile(upload) {
    try {
      const metadata = upload.metadata || {};
      const filePath = path.join('./uploads/temp', upload.id);
      
      // 파일 정보 업데이트
      await prisma.files.update({
        where: { id: upload.id },
        data: {
          status: 'PROCESSING',
          uploadProgress: 100,
          uploadedSize: upload.size
        }
      });

      // 비디오 메타데이터 추출
      const videoMetadata = await this.extractVideoMetadata(filePath);
      
      // 썸네일 생성
      const thumbnailPath = await this.generateThumbnail(filePath, upload.id);
      
      // 최종 경로로 파일 이동
      const finalPath = path.join('./uploads/videos', `${upload.id}.mp4`);
      await fs.mkdir('./uploads/videos', { recursive: true });
      await fs.rename(filePath, finalPath);
      
      // 비디오 레코드 생성
      const video = await prisma.videos.create({
        data: {
          id: upload.id,
          title: metadata.title || 'Untitled Video',
          description: metadata.description || '',
          userId: metadata.userId,
          channelId: metadata.channelId,
          videoUrl: finalPath,
          thumbnailUrl: thumbnailPath,
          duration: videoMetadata.duration,
          fileSize: upload.size,
          mimeType: metadata.filetype || 'video/mp4',
          width: videoMetadata.width,
          height: videoMetadata.height,
          status: 'PROCESSING',
          category: metadata.category || 'general',
          tags: metadata.tags || []
        }
      });

      // 파일 상태 업데이트
      await prisma.files.update({
        where: { id: upload.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      // HLS 변환 시작
      await this.convertToAdaptiveStreaming(finalPath, video.id);
      
      console.log('Video processing completed:', video.id);
      
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      
      await prisma.files.update({
        where: { id: upload.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
    }
  }

  // 비디오 메타데이터 추출
  extractVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
          
          resolve({
            duration: Math.floor(metadata.format.duration),
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            fps: eval(videoStream?.r_frame_rate) || 0,
            bitrate: metadata.format.bit_rate,
            videoCodec: videoStream?.codec_name,
            audioCodec: audioStream?.codec_name,
            format: metadata.format.format_name
          });
        }
      });
    });
  }

  // 썸네일 생성
  async generateThumbnail(videoPath, videoId) {
    const thumbnailDir = './uploads/thumbnails';
    await fs.mkdir(thumbnailDir, { recursive: true });
    
    const thumbnails = [];
    
    // 여러 시점의 썸네일 생성
    const timestamps = ['10%', '30%', '50%', '70%', '90%'];
    
    for (let i = 0; i < timestamps.length; i++) {
      const thumbnailPath = path.join(thumbnailDir, `${videoId}_thumb_${i}.jpg`);
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamps[i]],
            filename: `${videoId}_thumb_${i}.jpg`,
            folder: thumbnailDir,
            size: '1280x720'
          })
          .on('end', () => {
            thumbnails.push(thumbnailPath);
            resolve();
          })
          .on('error', reject);
      });
    }
    
    // 첫 번째 썸네일을 기본으로 사용
    return thumbnails[0];
  }

  // 적응형 스트리밍으로 변환
  async convertToAdaptiveStreaming(inputPath, videoId) {
    const outputDir = path.join('./uploads/hls', videoId);
    await fs.mkdir(outputDir, { recursive: true });
    
    // 비디오 정보 가져오기
    const metadata = await this.extractVideoMetadata(inputPath);
    
    // 원본 해상도에 따라 변환 품질 결정
    const qualities = this.determineQualities(metadata.width, metadata.height);
    
    // 각 품질로 변환
    for (const quality of qualities) {
      await this.encodeQuality(inputPath, outputDir, quality, videoId);
    }
    
    // Master playlist 생성
    await this.createMasterPlaylist(outputDir, qualities);
    
    // DASH manifest 생성 (선택사항)
    await this.createDashManifest(outputDir, qualities, videoId);
    
    // 비디오 상태 업데이트
    await prisma.videos.update({
      where: { id: videoId },
      data: {
        status: 'PUBLISHED',
        hlsUrl: `/api/stream/hls/${videoId}/master.m3u8`,
        dashUrl: `/api/stream/dash/${videoId}/manifest.mpd`,
        processedAt: new Date()
      }
    });
  }

  // 품질 레벨 결정
  determineQualities(width, height) {
    const qualities = [];
    
    // 원본 해상도 포함
    qualities.push({
      name: 'original',
      width: width,
      height: height,
      bitrate: '8000k',
      audioBitrate: '192k'
    });
    
    // 1080p
    if (height >= 1080) {
      qualities.push({
        name: '1080p',
        width: 1920,
        height: 1080,
        bitrate: '5000k',
        audioBitrate: '128k'
      });
    }
    
    // 720p
    if (height >= 720) {
      qualities.push({
        name: '720p',
        width: 1280,
        height: 720,
        bitrate: '2800k',
        audioBitrate: '128k'
      });
    }
    
    // 480p
    if (height >= 480) {
      qualities.push({
        name: '480p',
        width: 854,
        height: 480,
        bitrate: '1400k',
        audioBitrate: '96k'
      });
    }
    
    // 360p (always include for mobile)
    qualities.push({
      name: '360p',
      width: 640,
      height: 360,
      bitrate: '800k',
      audioBitrate: '96k'
    });
    
    return qualities;
  }

  // 특정 품질로 인코딩
  async encodeQuality(inputPath, outputDir, quality, videoId) {
    const qualityDir = path.join(outputDir, quality.name);
    await fs.mkdir(qualityDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      const outputPath = path.join(qualityDir, 'index.m3u8');
      
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-profile:v', 'main',
          '-level', '4.0',
          '-g', '48',
          '-keyint_min', '48',
          '-sc_threshold', '0',
          '-b:v', quality.bitrate,
          '-maxrate', quality.bitrate,
          '-bufsize', `${parseInt(quality.bitrate) * 2}k`,
          '-s', `${quality.width}x${quality.height}`,
          '-c:a', 'aac',
          '-b:a', quality.audioBitrate,
          '-ar', '44100',
          '-ac', '2',
          '-hls_time', '4',
          '-hls_list_size', '0',
          '-hls_playlist_type', 'vod',
          '-hls_segment_filename', path.join(qualityDir, 'segment_%05d.ts'),
          '-f', 'hls'
        ])
        .output(outputPath);
      
      command
        .on('start', (cmd) => {
          console.log(`Starting encoding ${quality.name}:`, cmd);
        })
        .on('progress', (progress) => {
          // 진행률 업데이트
          if (global.io) {
            global.io.to(`video:${videoId}`).emit('encoding:progress', {
              videoId: videoId,
              quality: quality.name,
              percent: progress.percent
            });
          }
        })
        .on('end', () => {
          console.log(`Encoding completed: ${quality.name}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Encoding error ${quality.name}:`, err);
          reject(err);
        })
        .run();
    });
  }

  // Master playlist 생성
  async createMasterPlaylist(outputDir, qualities) {
    let masterContent = '#EXTM3U\n';
    masterContent += '#EXT-X-VERSION:3\n';
    
    for (const quality of qualities) {
      const bandwidth = parseInt(quality.bitrate) * 1000 + parseInt(quality.audioBitrate) * 1000;
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height},NAME="${quality.name}"\n`;
      masterContent += `${quality.name}/index.m3u8\n`;
    }
    
    await fs.writeFile(path.join(outputDir, 'master.m3u8'), masterContent);
  }

  // DASH manifest 생성
  async createDashManifest(outputDir, qualities, videoId) {
    // DASH MPD 생성 로직
    // 이 부분은 복잡하므로 별도 라이브러리 사용 권장
    // 예: dash.js, Shaka Packager 등
  }

  // Express 미들웨어로 사용
  getMiddleware() {
    return {
      upload: this.server.handle.bind(this.server),
      // 추가 엔드포인트
      getUploadStatus: async (req, res) => {
        const { uploadId } = req.params;
        const file = await prisma.files.findUnique({
          where: { id: uploadId }
        });
        res.json(file);
      }
    };
  }
}

module.exports = UploadServer;