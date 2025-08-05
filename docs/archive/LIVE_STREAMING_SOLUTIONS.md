# 🎥 라이브 스트리밍 & 녹화 솔루션

## 1. Vultr 기반 자체 구축

### 1.1 Vultr + OBS Ninja + nginx-rtmp
```yaml
구성:
  - Vultr Cloud Compute: 스트리밍 서버
  - nginx-rtmp-module: RTMP 수신
  - FFmpeg: 트랜스코딩 & 녹화
  - Vultr Object Storage: 녹화 파일 저장

비용:
  - 서버: $20-40/월 (4GB RAM)
  - 스토리지: $5/월 (250GB)
  - 총: $25-45/월

장점:
  - 완전한 제어
  - 녹화 자동화
  - 비용 효율적

단점:
  - 직접 관리 필요
  - 확장성 제한
```

### 1.2 구현 방법
```bash
# Vultr 서버에 nginx-rtmp 설치
sudo apt update
sudo apt install nginx libnginx-mod-rtmp ffmpeg

# nginx.conf 설정
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            
            # 녹화 설정
            record all;
            record_path /var/recordings;
            record_unique on;
            record_suffix .flv;
            
            # HLS 변환
            hls on;
            hls_path /var/www/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # 녹화 완료 시 S3 업로드
            exec_record_done ffmpeg -i $path -c copy $path.mp4 && 
                /usr/local/bin/upload-to-s3.sh $path.mp4;
        }
    }
}
```

## 2. 관리형 라이브 스트리밍 서비스

### 2.1 Mux (추천) 🏆
```yaml
특징:
  - 라이브 스트리밍 + 자동 녹화
  - 자동 트랜스코딩
  - 글로벌 CDN
  - API 중심

가격:
  - 라이브: $0.13/분 (스트리밍)
  - 녹화 저장: $0.007/분/월
  - 시청: $0.0013/분
  
예시 (월 100시간 스트리밍):
  - 스트리밍: 6,000분 × $0.13 = $780
  - 저장: 6,000분 × $0.007 = $42
  - 총: 약 $822/월

API:
  - RESTful API
  - Webhook 지원
  - 실시간 분석
```

### 2.2 AWS IVS (Interactive Video Service)
```yaml
특징:
  - 초저지연 (<3초)
  - 자동 녹화 S3 저장
  - 채팅 기능 내장
  - Twitch 기술 기반

가격:
  - 입력: $0.20/시간
  - 출력: $0.023/GB
  - 녹화: S3 비용만
  
예시 (월 100시간):
  - 입력: 100시간 × $0.20 = $20
  - 출력: 약 $50-100
  - 총: 약 $70-120/월

장점:
  - 매우 저렴
  - AWS 생태계
  - 안정적
```

### 2.3 Cloudflare Stream
```yaml
특징:
  - 라이브 + VOD
  - 자동 녹화
  - 글로벌 CDN
  - 간단한 가격

가격:
  - 스트리밍: $1/1000분 시청
  - 저장: $5/1000분
  - 인코딩: 무료
  
예시 (월 100시간):
  - 저장: 6,000분 × $0.005 = $30
  - 시청: 사용량에 따라
  - 총: 약 $30-100/월

장점:
  - 심플한 가격
  - CDN 포함
  - 쉬운 통합
```

### 2.4 Agora.io
```yaml
특징:
  - 실시간 비디오 SDK
  - 클라우드 녹화
  - 낮은 지연시간
  - 대규모 지원

가격:
  - 음성: $0.99/1000분
  - SD 비디오: $3.99/1000분
  - HD 비디오: $8.99/1000분
  - 녹화: $5.99/1000분

장점:
  - SDK 품질
  - 글로벌 인프라
  - 기술 지원
```

## 3. 하이브리드 솔루션 (권장) 🎯

### 3.1 아키텍처
```yaml
구성:
  - OBS/웹캠 → nginx-rtmp (Vultr)
  - nginx-rtmp → Mux/AWS IVS (재전송)
  - 녹화 → Vultr Object Storage
  - 재생 → HLS/DASH

장점:
  - 비용 최적화
  - 이중화
  - 유연성
```

### 3.2 구현 예시
```typescript
// lib/streaming/live-service.ts
export class LiveStreamingService {
  private rtmpUrl: string
  private muxStreamKey: string
  
  // 스트림 시작
  async startStream(channelId: string) {
    // 1. Vultr 서버에 RTMP 엔드포인트 생성
    const rtmpEndpoint = await this.createRTMPEndpoint(channelId)
    
    // 2. Mux 라이브 스트림 생성 (백업 & 글로벌 배포)
    const muxStream = await this.mux.video.liveStreams.create({
      playback_policy: 'public',
      new_asset_settings: {
        playback_policy: 'public'
      },
      // 자동 녹화 설정
      reconnect_window: 60,
      reduced_latency: true
    })
    
    // 3. 동시 전송 설정
    await this.setupSimulcast(rtmpEndpoint, muxStream.stream_key)
    
    return {
      rtmpUrl: rtmpEndpoint,
      playbackUrl: muxStream.playback_ids[0].url,
      streamKey: muxStream.stream_key
    }
  }
  
  // 녹화 처리
  async processRecording(streamId: string) {
    // 1. 로컬 녹화 파일 확인
    const localRecording = `/var/recordings/${streamId}.flv`
    
    // 2. MP4 변환
    await this.convertToMP4(localRecording)
    
    // 3. Vultr Object Storage 업로드
    const uploadedUrl = await this.uploadToVultr(
      `${streamId}.mp4`,
      `recordings/${streamId}.mp4`
    )
    
    // 4. DB 업데이트
    await this.updateVideoRecord(streamId, {
      recordingUrl: uploadedUrl,
      duration: await this.getVideoDuration(`${streamId}.mp4`),
      status: 'recorded'
    })
  }
}
```

## 4. 비용 비교 (월 100시간 스트리밍)

| 솔루션 | 스트리밍 | 녹화/저장 | 총 비용 | 특징 |
|--------|---------|----------|---------|------|
| Vultr 자체구축 | $40 | $5 | **$45** | 직접 관리 |
| AWS IVS | $20 | $50 | **$70** | 가장 저렴 |
| Cloudflare | $30 | 사용량별 | **$30-100** | 간단함 |
| Mux | $780 | $42 | **$822** | 최고 품질 |
| Agora | $540 | $360 | **$900** | SDK 우수 |

## 5. 동영상 플랫폼 추천 솔루션

### 5.1 초기 (적은 트래픽)
```yaml
구성:
  - Vultr 서버 + nginx-rtmp
  - FFmpeg 녹화
  - Vultr Object Storage
  
비용: 월 $45
장점: 저렴, 완전 제어
단점: 수동 관리
```

### 5.2 성장기 (중간 트래픽)
```yaml
구성:
  - AWS IVS (라이브)
  - S3 녹화 저장
  - CloudFront CDN
  
비용: 월 $70-120
장점: 안정적, 자동화
단점: AWS 종속
```

### 5.3 대규모 (높은 트래픽)
```yaml
구성:
  - Mux (글로벌 스트리밍)
  - Vultr Storage (백업)
  - 자체 CDN
  
비용: 월 $800+
장점: 최고 품질, 글로벌
단점: 비용
```

## 6. 구현 로드맵

### Phase 1: MVP (2주)
```bash
# Vultr 서버 설정
1. nginx-rtmp 설치
2. 기본 스트리밍 테스트
3. 로컬 녹화 구현
4. S3 업로드 자동화
```

### Phase 2: 안정화 (2주)
```bash
# 백업 & 이중화
1. AWS IVS 연동
2. 동시 전송 설정
3. 자동 장애 복구
4. 모니터링 구축
```

### Phase 3: 확장 (2주)
```bash
# 글로벌 서비스
1. CDN 최적화
2. 다중 화질 지원
3. 실시간 분석
4. 수익화 기능
```

## 7. 기술 스택 정리

### 7.1 스트리밍 서버
```nginx
# /etc/nginx/nginx.conf
rtmp {
    server {
        listen 1935;
        
        application live {
            live on;
            
            # 동시 전송 (Simulcast)
            push rtmp://a.rtmp.youtube.com/live2/YOUTUBE_KEY;
            push rtmp://live.twitch.tv/app/TWITCH_KEY;
            push rtmp://global-live.mux.com:5222/app/MUX_KEY;
            
            # 녹화
            record all;
            record_path /recordings;
            record_suffix .flv;
            
            # HLS
            hls on;
            hls_path /hls;
            hls_fragment 3;
        }
    }
}
```

### 7.2 프론트엔드 플레이어
```typescript
// 라이브 플레이어 컴포넌트
import Hls from 'hls.js'

export function LivePlayer({ streamUrl }: { streamUrl: string }) {
  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })
      hls.loadSource(streamUrl)
      hls.attachMedia(videoRef.current)
    }
  }, [streamUrl])
  
  return <video ref={videoRef} controls />
}
```

## 8. 결론

### 동영상 플랫폼 추천:

**시작**: Vultr + nginx-rtmp (월 $45)
- 직접 구축으로 비용 최소화
- 기본 스트리밍 + 녹화 가능

**성장 시**: AWS IVS 추가 (월 $70-120)
- 안정성 확보
- 글로벌 서비스 준비

**대규모**: Mux 전환 고려
- 최고 품질
- 완전 관리형

이렇게 단계적으로 확장하면 비용을 최적화하면서도 안정적인 서비스를 구축할 수 있습니다!