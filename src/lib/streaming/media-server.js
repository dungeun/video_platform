const NodeMediaServer = require('node-media-server');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { prisma } = require('../db/prisma');

// Node Media Server 설정
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*',
    api: true
  },
  https: {
    port: 8443,
    key: './private.key',
    cert: './cert.crt',
  },
  trans: {
    ffmpeg: '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        hlsKeep: false, // 스트림 종료 후 파일 삭제 여부
        dash: true,
        dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
        dashKeep: false,
        mp4: true,
        mp4Flags: '[movflags=frag_keyframe+empty_moov]',
      }
    ]
  },
  // 녹화 설정
  record: {
    app: 'live',
    rec: true,
    recFlags: '[f=mp4:movflags=frag_keyframe+empty_moov:reset_timestamps=1]'
  }
};

class StreamingServer {
  constructor() {
    this.nms = new NodeMediaServer(config);
    this.activeStreams = new Map();
    this.recordingSessions = new Map();
  }

  start() {
    // 서버 시작
    this.nms.run();

    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    console.log('🎬 Streaming Server started on:');
    console.log(`   RTMP: rtmp://localhost:${config.rtmp.port}/live`);
    console.log(`   HTTP-FLV: http://localhost:${config.http.port}/live`);
    console.log(`   HLS: http://localhost:${config.http.port}/live/[stream_key]/index.m3u8`);
  }

  setupEventListeners() {
    // 스트림 시작 전 인증
    this.nms.on('prePublish', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/').pop();
      console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      
      try {
        // 데이터베이스에서 스트림 키 확인
        const liveStream = await prisma.live_streams.findFirst({
          where: { streamKey: streamKey }
        });

        if (!liveStream) {
          console.log('Invalid stream key:', streamKey);
          const session = this.nms.getSession(id);
          session.reject();
          return;
        }

        // 스트림 상태 업데이트
        await prisma.live_streams.update({
          where: { id: liveStream.id },
          data: {
            status: 'LIVE',
            startedAt: new Date(),
            rtmpUrl: `rtmp://localhost:1935${StreamPath}`,
            hlsUrl: `http://localhost:8000${StreamPath}/index.m3u8`,
            flvUrl: `http://localhost:8000${StreamPath}.flv`
          }
        });

        // 활성 스트림에 추가
        this.activeStreams.set(streamKey, {
          id: liveStream.id,
          channelId: liveStream.channelId,
          startTime: Date.now(),
          viewers: 0
        });

        // 녹화 시작
        this.startRecording(streamKey, liveStream.id);
        
      } catch (error) {
        console.error('Error in prePublish:', error);
        const session = this.nms.getSession(id);
        session.reject();
      }
    });

    // 스트림 종료
    this.nms.on('donePublish', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/').pop();
      console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      
      try {
        const streamInfo = this.activeStreams.get(streamKey);
        if (streamInfo) {
          // 스트림 상태 업데이트
          await prisma.live_streams.update({
            where: { id: streamInfo.id },
            data: {
              status: 'ENDED',
              endedAt: new Date(),
              duration: Math.floor((Date.now() - streamInfo.startTime) / 1000)
            }
          });

          // 녹화 중지 및 처리
          await this.stopRecording(streamKey, streamInfo.id);
          
          // 활성 스트림에서 제거
          this.activeStreams.delete(streamKey);
        }
      } catch (error) {
        console.error('Error in donePublish:', error);
      }
    });

    // 재생 시작 (시청자)
    this.nms.on('prePlay', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/').pop();
      console.log('[NodeEvent on prePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      
      const streamInfo = this.activeStreams.get(streamKey);
      if (streamInfo) {
        streamInfo.viewers++;
        
        // 시청자 수 업데이트
        await prisma.live_streams.update({
          where: { id: streamInfo.id },
          data: { viewerCount: streamInfo.viewers }
        });
      }
    });

    // 재생 종료 (시청자)
    this.nms.on('donePlay', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/').pop();
      console.log('[NodeEvent on donePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      
      const streamInfo = this.activeStreams.get(streamKey);
      if (streamInfo && streamInfo.viewers > 0) {
        streamInfo.viewers--;
        
        // 시청자 수 업데이트
        await prisma.live_streams.update({
          where: { id: streamInfo.id },
          data: { viewerCount: streamInfo.viewers }
        });
      }
    });
  }

  // 녹화 시작
  async startRecording(streamKey, streamId) {
    const recordPath = path.join('./recordings', `${streamId}_${Date.now()}.mp4`);
    
    // 녹화 디렉토리 생성
    await fs.mkdir('./recordings', { recursive: true });
    
    const recordCommand = ffmpeg(`rtmp://localhost:1935/live/${streamKey}`)
      .inputOptions([
        '-re',
        '-fflags', '+genpts'
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-c:a', 'aac',
        '-ar', '44100',
        '-b:a', '128k',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+faststart'
      ])
      .output(recordPath)
      .on('start', (commandLine) => {
        console.log('Started recording:', commandLine);
      })
      .on('error', (err) => {
        console.error('Recording error:', err);
      })
      .on('end', async () => {
        console.log('Recording finished:', recordPath);
        
        // 녹화 파일을 비디오 테이블에 추가
        await this.uploadRecordingToVideos(streamId, recordPath);
      });
    
    recordCommand.run();
    
    this.recordingSessions.set(streamKey, {
      command: recordCommand,
      path: recordPath
    });
  }

  // 녹화 중지
  async stopRecording(streamKey, streamId) {
    const session = this.recordingSessions.get(streamKey);
    if (session) {
      session.command.kill('SIGINT');
      this.recordingSessions.delete(streamKey);
      
      // 몇 초 대기 후 파일 업로드
      setTimeout(async () => {
        await this.uploadRecordingToVideos(streamId, session.path);
      }, 3000);
    }
  }

  // 녹화 파일을 비디오로 변환 및 업로드
  async uploadRecordingToVideos(streamId, recordPath) {
    try {
      const liveStream = await prisma.live_streams.findUnique({
        where: { id: streamId },
        include: { channels: true }
      });

      if (!liveStream) return;

      // 파일 정보 가져오기
      const stats = await fs.stat(recordPath);
      
      // FFprobe로 비디오 메타데이터 추출
      const metadata = await this.getVideoMetadata(recordPath);
      
      // 썸네일 생성
      const thumbnailPath = await this.generateThumbnail(recordPath, streamId);
      
      // 비디오 레코드 생성
      const video = await prisma.videos.create({
        data: {
          title: `${liveStream.title} - 라이브 녹화본`,
          description: liveStream.description || '라이브 스트림 녹화본입니다.',
          channelId: liveStream.channelId,
          userId: liveStream.channels.userId,
          videoUrl: recordPath, // 실제로는 S3/MinIO URL이 들어가야 함
          thumbnailUrl: thumbnailPath,
          duration: metadata.duration,
          fileSize: stats.size,
          mimeType: 'video/mp4',
          width: metadata.width,
          height: metadata.height,
          status: 'PROCESSING',
          isLiveRecording: true,
          originalStreamId: streamId
        }
      });

      console.log('Recording uploaded as video:', video.id);
      
      // HLS 변환 작업 큐에 추가
      await this.convertToHLS(recordPath, video.id);
      
    } catch (error) {
      console.error('Error uploading recording:', error);
    }
  }

  // 비디오 메타데이터 추출
  getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          resolve({
            duration: metadata.format.duration,
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            bitrate: metadata.format.bit_rate,
            codec: videoStream?.codec_name
          });
        }
      });
    });
  }

  // 썸네일 생성
  async generateThumbnail(videoPath, streamId) {
    const thumbnailPath = path.join('./thumbnails', `${streamId}_thumb.jpg`);
    
    await fs.mkdir('./thumbnails', { recursive: true });
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['10%'],
          filename: `${streamId}_thumb.jpg`,
          folder: './thumbnails',
          size: '1280x720'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', reject);
    });
  }

  // HLS 변환
  async convertToHLS(inputPath, videoId) {
    const outputDir = path.join('./hls', videoId);
    await fs.mkdir(outputDir, { recursive: true });
    
    const qualities = [
      { resolution: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
      { resolution: '720p', width: 1280, height: 720, bitrate: '2800k' },
      { resolution: '480p', width: 854, height: 480, bitrate: '1400k' },
      { resolution: '360p', width: 640, height: 360, bitrate: '800k' }
    ];

    for (const quality of qualities) {
      const outputPath = path.join(outputDir, quality.resolution);
      await fs.mkdir(outputPath, { recursive: true });
      
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-g', '48',
            '-sc_threshold', '0',
            '-map', '0:v:0',
            '-map', '0:a:0',
            `-s:v:0`, `${quality.width}x${quality.height}`,
            `-b:v:0`, quality.bitrate,
            '-c:a', 'aac',
            '-b:a', '128k',
            '-hls_time', '4',
            '-hls_playlist_type', 'vod',
            '-hls_segment_filename', path.join(outputPath, 'segment_%03d.ts'),
            '-master_pl_name', 'master.m3u8',
            '-f', 'hls'
          ])
          .output(path.join(outputPath, 'index.m3u8'))
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    }

    // Master playlist 생성
    await this.createMasterPlaylist(outputDir, qualities);
    
    // 비디오 상태 업데이트
    await prisma.videos.update({
      where: { id: videoId },
      data: {
        status: 'PUBLISHED',
        hlsUrl: `/hls/${videoId}/master.m3u8`
      }
    });
  }

  // Master playlist 생성
  async createMasterPlaylist(outputDir, qualities) {
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
    
    for (const quality of qualities) {
      const bandwidth = parseInt(quality.bitrate) * 1000;
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height}\n`;
      masterContent += `${quality.resolution}/index.m3u8\n`;
    }
    
    await fs.writeFile(path.join(outputDir, 'master.m3u8'), masterContent);
  }

  stop() {
    this.nms.stop();
    console.log('🛑 Streaming Server stopped');
  }
}

module.exports = StreamingServer;