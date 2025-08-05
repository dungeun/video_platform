#!/bin/bash
# Ant Media Server 자동 설치 스크립트
# 사용법: bash install-antmedia.sh

set -e

echo "🚀 Ant Media Server 설치 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 성공 메시지
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 함수: 경고 메시지
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 함수: 에러 메시지
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Root 권한 확인
if [[ $EUID -ne 0 ]]; then
   error "이 스크립트는 root 권한으로 실행해야 합니다. 'sudo bash install-antmedia.sh' 명령을 사용하세요."
fi

# 1. 시스템 업데이트
echo "📦 시스템 패키지 업데이트 중..."
apt update && apt upgrade -y
success "시스템 업데이트 완료"

# 2. 방화벽 설정
echo "🔥 방화벽 규칙 설정 중..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 1935/tcp  # RTMP
ufw allow 5080/tcp  # Ant Media HTTP
ufw allow 5443/tcp  # Ant Media HTTPS
ufw allow 5000:5999/tcp  # WebRTC TCP
ufw allow 50000:60000/udp  # WebRTC UDP
ufw --force enable
success "방화벽 설정 완료"

# 3. 시스템 최적화
echo "⚙️  시스템 최적화 중..."
cat >> /etc/sysctl.conf <<EOF
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_moderate_rcvbuf=1
EOF
sysctl -p

cat >> /etc/security/limits.conf <<EOF
* soft nofile 65536
* hard nofile 65536
EOF
success "시스템 최적화 완료"

# 4. Java 11 설치
echo "☕ Java 11 설치 중..."
apt install -y openjdk-11-jdk unzip curl wget
java -version
success "Java 11 설치 완료"

# 5. Ant Media Server 다운로드
echo "📥 Ant Media Server 다운로드 중..."
cd /tmp
wget https://github.com/ant-media/Ant-Media-Server/releases/download/ams-v2.8.2/ant-media-server-community-2.8.2.zip
success "다운로드 완료"

# 6. Ant Media Server 설치
echo "🔧 Ant Media Server 설치 중..."
unzip -q ant-media-server-community-2.8.2.zip
cd ant-media-server
./install_ant-media-server.sh
success "Ant Media Server 설치 완료"

# 7. 서비스 시작
echo "🚀 Ant Media Server 시작 중..."
systemctl start antmedia
systemctl enable antmedia
sleep 5
success "Ant Media Server 시작 완료"

# 8. 상태 확인
if systemctl is-active --quiet antmedia; then
    success "Ant Media Server가 정상적으로 실행 중입니다"
else
    error "Ant Media Server 시작 실패"
fi

# 9. 관리자 정보 출력
echo ""
echo "================================================"
echo -e "${GREEN}✅ Ant Media Server 설치 완료!${NC}"
echo "================================================"
echo ""
echo "📌 접속 정보:"
echo "   URL: http://$(curl -s ifconfig.me):5080"
echo "   설치 로그에서 관리자 계정 정보를 확인하세요"
echo ""
echo "📌 다음 단계:"
echo "   1. 웹 브라우저로 관리자 패널 접속"
echo "   2. LiveApp 애플리케이션 생성"
echo "   3. S3 스토리지 설정"
echo "   4. SSL 인증서 설정"
echo ""
echo "📌 유용한 명령어:"
echo "   서비스 상태: systemctl status antmedia"
echo "   로그 확인: tail -f /usr/local/antmedia/log/ant-media-server.log"
echo "   서비스 재시작: systemctl restart antmedia"
echo ""
echo "================================================"

# 10. 로그 파일 위치 생성
mkdir -p /var/log/antmedia
echo "설치 완료: $(date)" > /var/log/antmedia/install.log

# 11. 자동 백업 스크립트 생성
cat > /usr/local/bin/backup-antmedia.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/tmp/antmedia-backup-$DATE"
mkdir -p $BACKUP_DIR
cp -r /usr/local/antmedia/conf $BACKUP_DIR/
cp -r /usr/local/antmedia/webapps/*/WEB-INF/*.properties $BACKUP_DIR/ 2>/dev/null || true
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
echo "백업 완료: $BACKUP_DIR.tar.gz"
rm -rf $BACKUP_DIR
EOF
chmod +x /usr/local/bin/backup-antmedia.sh

# 12. 헬스 체크 스크립트 생성
cat > /usr/local/bin/check-antmedia.sh <<'EOF'
#!/bin/bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5080/rest/v2/broadcasts/list/0/10)
if [ $STATUS -ne 200 ]; then
    echo "$(date): Ant Media Server is down, restarting..." >> /var/log/antmedia/health-check.log
    systemctl restart antmedia
fi
EOF
chmod +x /usr/local/bin/check-antmedia.sh

# 13. Cron 작업 추가 (5분마다 헬스 체크)
echo "*/5 * * * * /usr/local/bin/check-antmedia.sh" | crontab -

success "모든 설치가 완료되었습니다!"