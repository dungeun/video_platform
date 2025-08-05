# 🚀 Ant Media Server 빠른 시작 가이드

## 1. Vultr 서버 생성

### 1.1 서버 사양 선택
```yaml
서버 타입: Cloud Compute - Regular
위치: Seoul (한국 사용자 대상)
OS: Ubuntu 20.04 x64
플랜: 
  - 개발/테스트: $20/월 (2 vCPU, 4GB RAM, 80GB SSD)
  - 프로덕션 초기: $40/월 (4 vCPU, 8GB RAM, 160GB SSD)
```

### 1.2 서버 설정
1. Vultr 대시보드에서 "Deploy New Server" 클릭
2. Cloud Compute → Regular Performance 선택
3. Seoul 리전 선택
4. Ubuntu 20.04 x64 선택
5. 서버 플랜 선택
6. Hostname: `ant-media-videopick` 설정
7. Deploy Now 클릭

## 2. 서버 초기 설정

### 2.1 SSH 접속
```bash
# Vultr에서 제공한 IP로 접속
ssh root@YOUR_SERVER_IP
```

### 2.2 시스템 업데이트 및 보안 설정
```bash
# 시스템 업데이트
apt update && apt upgrade -y

# 방화벽 설정
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 1935/tcp  # RTMP
ufw allow 5080/tcp  # Ant Media HTTP
ufw allow 5443/tcp  # Ant Media HTTPS
ufw allow 5000:5999/tcp  # WebRTC TCP
ufw allow 50000:60000/udp  # WebRTC UDP
ufw --force enable

# 시스템 최적화
echo "net.core.rmem_max=134217728" >> /etc/sysctl.conf
echo "net.core.wmem_max=134217728" >> /etc/sysctl.conf
echo "net.ipv4.tcp_moderate_rcvbuf=1" >> /etc/sysctl.conf
sysctl -p

# 파일 디스크립터 증가
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

## 3. Ant Media Server 설치

### 3.1 필수 패키지 설치
```bash
# Java 11 설치
apt install -y openjdk-11-jdk unzip curl wget

# Java 버전 확인
java -version
```

### 3.2 Ant Media Server 다운로드 및 설치
```bash
cd /tmp

# Community Edition 다운로드
wget https://github.com/ant-media/Ant-Media-Server/releases/download/ams-v2.8.2/ant-media-server-community-2.8.2.zip

# 압축 해제
unzip ant-media-server-community-2.8.2.zip

# 설치 스크립트 실행
cd ant-media-server
sudo ./install_ant-media-server.sh

# 서비스 시작
systemctl start antmedia
systemctl enable antmedia

# 상태 확인
systemctl status antmedia
```

## 4. Ant Media 기본 설정

### 4.1 관리자 패널 접속
```
URL: http://YOUR_SERVER_IP:5080
기본 계정: 설치 시 생성된 계정 정보 확인
```

### 4.2 앱 생성
1. 관리자 패널 로그인
2. Applications → New Application
3. App Name: `LiveApp` 입력
4. Create 클릭

### 4.3 S3 연동 설정 (Vultr Object Storage)
```bash
# 설정 파일 편집
nano /usr/local/antmedia/webapps/LiveApp/WEB-INF/red5-web.properties

# 다음 내용 추가
settings.mp4MuxingEnabled=true
settings.hlsMuxingEnabled=true
settings.webRTCEnabled=true
settings.recordingEnabled=true
settings.mp4RecordingEnabled=true
settings.addDateTimeToMp4FileName=true

# S3 설정 (Vultr Object Storage)
settings.s3RecordingEnabled=true
settings.s3AccessKey=YOUR_VULTR_ACCESS_KEY
settings.s3SecretKey=YOUR_VULTR_SECRET_KEY
settings.s3BucketName=videopick-recordings
settings.s3Endpoint=https://sgp1.vultrobjects.com
settings.s3Region=sgp1

# 서비스 재시작
systemctl restart antmedia
```

## 5. SSL 인증서 설정 (Let's Encrypt)

### 5.1 도메인 설정
```bash
# A 레코드 추가 (DNS 관리 패널에서)
stream.video.one-q.xyz → YOUR_SERVER_IP
```

### 5.2 SSL 인증서 발급
```bash
# Certbot 설치
apt install -y certbot

# SSL 인증서 발급
certbot certonly --standalone -d stream.video.one-q.xyz

# Ant Media SSL 활성화
cd /usr/local/antmedia
./enable_ssl.sh -d stream.video.one-q.xyz
```

## 6. 테스트 및 확인

### 6.1 RTMP 스트리밍 테스트
```yaml
OBS 설정:
  서버: rtmp://stream.video.one-q.xyz/LiveApp
  스트림 키: test123
```

### 6.2 재생 테스트
```
WebRTC: https://stream.video.one-q.xyz:5443/LiveApp/play.html?name=test123
HLS: https://stream.video.one-q.xyz:5443/LiveApp/streams/test123.m3u8
```

### 6.3 녹화 확인
```bash
# 녹화 파일 위치
ls -la /usr/local/antmedia/webapps/LiveApp/streams/

# S3 업로드 확인 (Vultr Object Storage)
# Vultr 대시보드에서 확인
```

## 7. Next.js 통합 코드

### 7.1 환경 변수 설정
```env
# .env.local
ANT_MEDIA_URL=https://stream.video.one-q.xyz:5443
ANT_MEDIA_APP=LiveApp
ANT_MEDIA_API_KEY=your-api-key
```

### 7.2 스트리밍 서비스
```typescript
// lib/streaming/antmedia.ts
export class AntMediaClient {
  private baseUrl: string
  private app: string
  
  constructor() {
    this.baseUrl = process.env.ANT_MEDIA_URL!
    this.app = process.env.ANT_MEDIA_APP!
  }
  
  async createStream(streamId: string) {
    const response = await fetch(
      `${this.baseUrl}/rest/v2/broadcasts/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId,
          name: streamId,
          type: 'liveStream',
        }),
      }
    )
    return response.json()
  }
  
  getStreamUrls(streamId: string) {
    return {
      rtmp: `rtmp://${this.baseUrl.replace('https://', '')}/LiveApp`,
      streamKey: streamId,
      webrtc: `${this.baseUrl}/LiveApp/play.html?name=${streamId}`,
      hls: `${this.baseUrl}/LiveApp/streams/${streamId}.m3u8`,
    }
  }
}
```

### 7.3 스트리밍 컴포넌트
```tsx
// components/LiveStream.tsx
import { useEffect, useRef } from 'react'

export function LiveStreamPlayer({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    // WebRTC 플레이어 초기화
    const webrtcUrl = `${process.env.NEXT_PUBLIC_ANT_MEDIA_URL}/LiveApp/play.html?name=${streamId}`
    
    // iframe으로 Ant Media 플레이어 임베드
    // 또는 WebRTC 직접 구현
  }, [streamId])
  
  return (
    <div className="relative aspect-video">
      <iframe
        src={`${process.env.NEXT_PUBLIC_ANT_MEDIA_URL}/LiveApp/play.html?name=${streamId}`}
        className="w-full h-full"
        allowFullScreen
      />
    </div>
  )
}
```

## 8. 모니터링 설정

### 8.1 시스템 모니터링
```bash
# htop 설치
apt install -y htop

# 로그 확인
tail -f /usr/local/antmedia/log/ant-media-server.log
```

### 8.2 자동 재시작 스크립트
```bash
# /usr/local/bin/check-antmedia.sh
#!/bin/bash

# API 헬스 체크
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5080/LiveApp/rest/v2/broadcasts/list/0/10)

if [ $STATUS -ne 200 ]; then
    echo "Ant Media Server is down, restarting..."
    systemctl restart antmedia
    
    # 알림 (선택사항)
    # curl -X POST webhook-url -d "Ant Media Server restarted"
fi

# cron 등록 (5분마다 체크)
echo "*/5 * * * * /usr/local/bin/check-antmedia.sh" | crontab -
```

## 9. 백업 및 복구

### 9.1 설정 백업
```bash
# 설정 파일 백업
tar -czf antmedia-config-backup.tar.gz /usr/local/antmedia/conf /usr/local/antmedia/webapps/*/WEB-INF/*.properties

# Vultr Object Storage에 업로드
# s3cmd 또는 aws-cli 사용
```

### 9.2 자동 백업 스크립트
```bash
#!/bin/bash
# /usr/local/bin/backup-antmedia.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/tmp/antmedia-backup-$DATE"

mkdir -p $BACKUP_DIR
cp -r /usr/local/antmedia/conf $BACKUP_DIR/
cp -r /usr/local/antmedia/webapps/*/WEB-INF/*.properties $BACKUP_DIR/

tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
# S3 업로드 명령 추가

rm -rf $BACKUP_DIR
```

## 10. 문제 해결

### 10.1 일반적인 문제
```yaml
포트 접속 불가:
  - 방화벽 규칙 확인
  - ufw status 확인
  
WebRTC 연결 실패:
  - STUN/TURN 서버 설정 확인
  - SSL 인증서 확인
  
녹화 실패:
  - 디스크 공간 확인
  - 권한 확인
  - S3 자격 증명 확인
```

### 10.2 성능 튜닝
```bash
# JVM 메모리 증가 (8GB RAM 서버 기준)
nano /usr/local/antmedia/antmedia

# 다음 라인 수정
JAVA_OPTS="-Xms2g -Xmx6g"

# 재시작
systemctl restart antmedia
```

## 11. 비용 요약

### 초기 구성
- Vultr 서버 (4GB): $20/월
- Vultr Object Storage: $5/월
- 도메인: $1/월
- **총: $26/월**

### 프로덕션 구성
- Origin 서버: $20/월
- Edge 서버 x2: $80/월
- Object Storage: $20/월
- Load Balancer: $10/월
- **총: $130/월**

## 12. 다음 단계

1. **테스트**: OBS로 스트리밍 테스트
2. **통합**: Next.js 앱과 API 연동
3. **최적화**: 성능 모니터링 및 튜닝
4. **확장**: 필요시 Edge 서버 추가
5. **보안**: API 키 설정, IP 화이트리스트

이 가이드를 따라하면 30분 내에 기본적인 라이브 스트리밍 서버를 구축할 수 있습니다!