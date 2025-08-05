# 🎬 오픈소스 스트리밍 플랫폼 (Wowza 대안)

## 1. Ant Media Server (추천) 🏆

### 1.1 개요
```yaml
특징:
  - WebRTC + RTMP + HLS 지원
  - 자동 녹화 기능
  - 관리 웹 UI 제공
  - 클러스터링 지원
  - 한글 문서 있음

라이선스:
  - Community Edition: 무료 (오픈소스)
  - Enterprise Edition: 유료 (추가 기능)

핵심 기능:
  - 초저지연 스트리밍 (0.5초)
  - 자동 녹화 (MP4, WebM)
  - 적응형 비트레이트
  - 실시간 트랜스코딩
  - REST API
```

### 1.2 Vultr 설치 방법
```bash
# Vultr 서버 (Ubuntu 20.04, 4GB RAM)
wget https://github.com/ant-media/Ant-Media-Server/releases/download/ams-v2.8.2/ant-media-server-community-2.8.2.zip

unzip ant-media-server-community-2.8.2.zip
cd ant-media-server
sudo ./install_ant-media-server.sh

# 설치 완료 후
# 웹 UI: http://your-server-ip:5080
# 기본 계정: admin / admin
```

### 1.3 설정 예시
```javascript
// Ant Media 설정
{
  "datastore": {
    "dbType": "mongodb",
    "dbName": "antmedia",
    "dbHost": "localhost"
  },
  "settings": {
    "mp4MuxingEnabled": true,           // MP4 녹화
    "addDateTimeToMp4FileName": true,   // 타임스탬프 추가
    "hlsMuxingEnabled": true,           // HLS 스트리밍
    "deleteHLSFilesOnEnded": false,     // HLS 파일 보관
    "acceptOnlyStreamsInDataStore": false,
    "objectDetectionEnabled": false,
    "s3RecordingEnabled": true,         // S3 자동 업로드
    "s3AccessKey": "your-vultr-key",
    "s3SecretKey": "your-vultr-secret",
    "s3BucketName": "videopick-recordings",
    "s3Endpoint": "https://icn1.vultrobjects.com"
  }
}
```

## 2. OvenMediaEngine (OME)

### 2.1 개요
```yaml
특징:
  - 초저지연 WebRTC 스트리밍
  - RTMP 입력 → WebRTC 출력
  - 자동 녹화
  - 한국 개발 (AirenSoft)
  - 완전 무료

장점:
  - 매우 낮은 지연시간 (1초 미만)
  - 대규모 동시 시청 지원
  - Docker 지원
  - 한국어 문서

설치:
  - Docker 이미지 제공
  - 간단한 설정
```

### 2.2 Docker 설치
```bash
# docker-compose.yml
version: '3'
services:
  ome:
    image: airensoft/ovenmediaengine:latest
    ports:
      - "1935:1935"   # RTMP
      - "3333:3333"   # WebRTC Signaling
      - "3478:3478"   # WebRTC ICE
      - "8080:8080"   # HLS/DASH
      - "9999:9999"   # WebRTC Streaming
    volumes:
      - ./conf:/opt/ovenmediaengine/bin/origin_conf
      - ./recordings:/recordings
    environment:
      OME_ORIGIN_PORT: 9999
      OME_RTMP_PROV_PORT: 1935
```

### 2.3 녹화 설정
```xml
<!-- Server.xml -->
<Server>
  <Applications>
    <Application>
      <Name>live</Name>
      <OutputProfiles>
        <OutputProfile>
          <Name>recording</Name>
          <OutputStreamName>${OriginStreamName}_record</OutputStreamName>
          <Encodes>
            <Video>
              <Bypass>true</Bypass>
            </Video>
            <Audio>
              <Bypass>true</Bypass>
            </Audio>
          </Encodes>
        </OutputProfile>
      </OutputProfiles>
      <Publishers>
        <FILE>
          <FilePath>/recordings/${StartTime:YYYYMMDDhhmmss}_${StreamName}.mp4</FilePath>
          <RecordingRule>
            <Enable>true</Enable>
            <DisconnectRestart>true</DisconnectRestart>
          </RecordingRule>
        </FILE>
      </Publishers>
    </Application>
  </Applications>
</Server>
```

## 3. SRS (Simple Realtime Server)

### 3.1 개요
```yaml
특징:
  - 중국에서 개발 (인기 높음)
  - RTMP/WebRTC/HLS/HTTP-FLV
  - 자동 녹화
  - 매우 가벼움
  - 높은 성능

장점:
  - 리소스 사용 최소
  - 10만+ 동시 접속
  - Docker 지원
  - 활발한 커뮤니티
```

### 3.2 설치 및 설정
```bash
# Docker 실행
docker run -d -p 1935:1935 -p 1985:1985 -p 8080:8080 \
  -v ./recordings:/usr/local/srs/objs/nginx/html/recordings \
  ossrs/srs:5

# 설정 파일 (srs.conf)
listen              1935;
max_connections     1000;
daemon              off;

http_server {
    enabled         on;
    listen          8080;
}

vhost __defaultVhost__ {
    # 자동 녹화
    dvr {
        enabled         on;
        dvr_path        /recordings/[app]/[stream].[timestamp].mp4;
        dvr_plan        session;
        dvr_duration    30;
        dvr_wait_keyframe on;
    }
    
    # HLS 출력
    hls {
        enabled         on;
        hls_path        /usr/local/srs/objs/nginx/html;
        hls_fragment    10;
        hls_window      60;
    }
}
```

## 4. Node Media Server (가벼운 선택)

### 4.1 개요
```yaml
특징:
  - Node.js 기반
  - 매우 가벼움
  - 간단한 설정
  - 기본 기능 충실

장점:
  - 쉬운 커스터마이징
  - JavaScript로 확장 가능
  - 낮은 리소스 사용
```

### 4.2 설치
```javascript
// server.js
const NodeMediaServer = require('node-media-server');

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
    allow_origin: '*'
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        mp4: true,
        mp4Flags: '[movflags=frag_keyframe+empty_moov]',
      }
    ]
  }
};

const nms = new NodeMediaServer(config);
nms.run();

// 녹화 완료 이벤트
nms.on('donePublish', (id, StreamPath, args) => {
  // Vultr S3 업로드
  uploadToVultr(`${StreamPath}.mp4`);
});
```

## 5. 플랫폼 비교

| 플랫폼 | 난이도 | 성능 | 녹화 | 관리UI | 추천도 |
|--------|-------|------|------|--------|--------|
| **Ant Media** | 쉬움 | 높음 | ✅ 자동 | ✅ 웹UI | ⭐⭐⭐⭐⭐ |
| **OvenMediaEngine** | 중간 | 매우높음 | ✅ 자동 | ❌ | ⭐⭐⭐⭐ |
| **SRS** | 중간 | 매우높음 | ✅ 자동 | ⚠️ 기본 | ⭐⭐⭐⭐ |
| **Node Media** | 쉬움 | 보통 | ✅ 수동 | ❌ | ⭐⭐⭐ |

## 6. 통합 아키텍처 (Ant Media 기준)

### 6.1 전체 구성
```yaml
구성:
  1. Vultr 서버 (4GB RAM): $20/월
  2. Ant Media Server CE: 무료
  3. Vultr Object Storage: $5/월
  4. CloudFlare CDN: 무료
  
총 비용: $25/월

기능:
  - RTMP/WebRTC 입력
  - HLS/WebRTC 출력  
  - 자동 MP4 녹화
  - S3 자동 업로드
  - 웹 관리 UI
  - REST API
```

### 6.2 Next.js 통합
```typescript
// lib/streaming/antmedia-service.ts
export class AntMediaService {
  private apiUrl: string
  private apiKey: string
  
  constructor() {
    this.apiUrl = process.env.ANT_MEDIA_API_URL!
    this.apiKey = process.env.ANT_MEDIA_API_KEY!
  }
  
  // 스트림 생성
  async createStream(streamId: string) {
    const response = await fetch(`${this.apiUrl}/v2/broadcasts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey
      },
      body: JSON.stringify({
        streamId: streamId,
        name: `Stream ${streamId}`,
        type: 'liveStream',
        mp4Enabled: true,
        hlsEnabled: true,
        webRTCEnabled: true
      })
    })
    
    return response.json()
  }
  
  // 녹화 파일 목록
  async getRecordings(streamId: string) {
    const response = await fetch(
      `${this.apiUrl}/v2/vods/list/0/50?streamId=${streamId}`,
      {
        headers: { 'Authorization': this.apiKey }
      }
    )
    
    return response.json()
  }
  
  // 스트림 상태
  async getStreamInfo(streamId: string) {
    const response = await fetch(
      `${this.apiUrl}/v2/broadcasts/${streamId}`,
      {
        headers: { 'Authorization': this.apiKey }
      }
    )
    
    return response.json()
  }
}
```

### 6.3 스트리밍 컴포넌트
```tsx
// components/StreamingStudio.tsx
export function StreamingStudio({ channelId }: { channelId: string }) {
  const [streamKey, setStreamKey] = useState('')
  const [isLive, setIsLive] = useState(false)
  
  const startStream = async () => {
    const stream = await antMediaService.createStream(channelId)
    setStreamKey(stream.streamId)
    
    // RTMP URL 표시
    const rtmpUrl = `rtmp://your-server.com/LiveApp/${stream.streamId}`
    
    // OBS 설정 안내
    alert(`
      OBS 설정:
      서버: rtmp://your-server.com/LiveApp
      스트림 키: ${stream.streamId}
    `)
  }
  
  return (
    <div>
      <h2>라이브 스트리밍</h2>
      {!isLive ? (
        <button onClick={startStream}>방송 시작</button>
      ) : (
        <div>
          <p>방송 중...</p>
          <LivePlayer streamId={streamKey} />
        </div>
      )}
    </div>
  )
}
```

## 7. 설치 가이드 (Ant Media)

### 7.1 Vultr 서버 준비
```bash
# 1. Vultr에서 Ubuntu 20.04 서버 생성 (4GB RAM)
# 2. SSH 접속

# 3. 필수 패키지 설치
sudo apt update
sudo apt install -y openjdk-11-jdk unzip

# 4. Ant Media 다운로드 및 설치
wget https://github.com/ant-media/Ant-Media-Server/releases/download/ams-v2.8.2/ant-media-server-community-2.8.2.zip
unzip ant-media-server-community-2.8.2.zip
cd ant-media-server
sudo ./install_ant-media-server.sh

# 5. 서비스 시작
sudo systemctl start antmedia
sudo systemctl enable antmedia
```

### 7.2 S3 연동 설정
```bash
# 웹 UI 접속: http://your-ip:5080
# Settings → S3 Recording 활성화
# Vultr Object Storage 정보 입력
```

## 8. 결론 및 추천

### 🏆 추천: Ant Media Server CE

**이유:**
1. **완전한 통합 솔루션** - 스트리밍 + 녹화 + 관리
2. **웹 UI 제공** - 쉬운 관리
3. **자동 S3 업로드** - Vultr 연동 가능
4. **REST API** - 쉬운 통합
5. **무료** - Community Edition

**비용:**
- Vultr 서버: $20/월
- Ant Media: 무료
- 스토리지: $5/월
- **총: $25/월**

Wowza 대신 Ant Media Server를 사용하면 관리가 훨씬 간단하고 비용도 저렴합니다!