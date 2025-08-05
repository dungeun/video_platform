#!/bin/bash
# Ant Media Server S3 (Vultr Object Storage) 설정 스크립트

set -e

echo "🔧 Ant Media Server S3 설정 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 함수 정의
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 환경 변수 입력
echo "Vultr Object Storage 정보를 입력하세요:"
read -p "Access Key: " S3_ACCESS_KEY
read -s -p "Secret Key: " S3_SECRET_KEY
echo
read -p "Bucket Name (예: videopick-recordings): " S3_BUCKET_NAME
read -p "Endpoint URL (예: https://sgp1.vultrobjects.com): " S3_ENDPOINT
read -p "Region (예: sgp1): " S3_REGION

# 애플리케이션 목록 확인
info "설정 가능한 애플리케이션:"
ls /usr/local/antmedia/webapps/ | grep -v ROOT

read -p "설정할 애플리케이션 이름 (기본: LiveApp): " APP_NAME
APP_NAME=${APP_NAME:-LiveApp}

# 설정 파일 경로
PROPS_FILE="/usr/local/antmedia/webapps/$APP_NAME/WEB-INF/red5-web.properties"

if [ ! -f "$PROPS_FILE" ]; then
    echo "❌ 설정 파일을 찾을 수 없습니다: $PROPS_FILE"
    exit 1
fi

# 백업 생성
cp $PROPS_FILE ${PROPS_FILE}.backup.$(date +%Y%m%d-%H%M%S)
success "설정 파일 백업 완료"

# S3 설정 추가/업데이트
info "S3 설정 업데이트 중..."

# 기존 S3 설정 제거 (있는 경우)
sed -i '/settings.s3/d' $PROPS_FILE

# 새 S3 설정 추가
cat >> $PROPS_FILE <<EOF

# Vultr Object Storage Settings
settings.s3RecordingEnabled=true
settings.s3AccessKey=$S3_ACCESS_KEY
settings.s3SecretKey=$S3_SECRET_KEY
settings.s3BucketName=$S3_BUCKET_NAME
settings.s3Endpoint=$S3_ENDPOINT
settings.s3Region=$S3_REGION
settings.s3RecordingPath=recordings/
settings.s3Permission=public-read

# Recording Settings
settings.mp4MuxingEnabled=true
settings.addDateTimeToMp4FileName=true
settings.hlsMuxingEnabled=true
settings.webRTCEnabled=true
settings.recordingEnabled=true
settings.mp4RecordingEnabled=true
settings.deleteLocalRecordingsAfterUpload=false
EOF

success "S3 설정 추가 완료"

# Ant Media Server 재시작
info "Ant Media Server 재시작 중..."
systemctl restart antmedia
sleep 5

# 상태 확인
if systemctl is-active --quiet antmedia; then
    success "Ant Media Server가 정상적으로 재시작되었습니다"
else
    echo "❌ Ant Media Server 재시작 실패"
    exit 1
fi

# S3 연결 테스트 스크립트 생성
cat > /usr/local/bin/test-s3-upload.sh <<EOF
#!/bin/bash
# S3 업로드 테스트 스크립트

# 테스트 파일 생성
echo "Test file created at \$(date)" > /tmp/test-s3.txt

# aws-cli 설치 확인
if ! command -v aws &> /dev/null; then
    echo "aws-cli 설치 중..."
    apt install -y awscli
fi

# AWS 설정
export AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$S3_SECRET_KEY

# 업로드 테스트
aws s3 cp /tmp/test-s3.txt s3://$S3_BUCKET_NAME/test-s3.txt \\
    --endpoint-url $S3_ENDPOINT \\
    --region $S3_REGION

if [ \$? -eq 0 ]; then
    echo "✅ S3 업로드 테스트 성공!"
    aws s3 rm s3://$S3_BUCKET_NAME/test-s3.txt \\
        --endpoint-url $S3_ENDPOINT \\
        --region $S3_REGION
else
    echo "❌ S3 업로드 테스트 실패"
fi

rm -f /tmp/test-s3.txt
EOF

chmod +x /usr/local/bin/test-s3-upload.sh

# 자동 업로드 스크립트 생성
cat > /usr/local/bin/upload-recording-to-s3.sh <<'EOF'
#!/bin/bash
# 녹화 파일 S3 자동 업로드 스크립트
# Ant Media Server webhook에서 호출됨

RECORDING_PATH=$1
STREAM_ID=$2
FILENAME=$(basename $RECORDING_PATH)

# 환경 변수 설정
source /etc/antmedia/s3.env

# S3 업로드
aws s3 cp $RECORDING_PATH s3://$S3_BUCKET_NAME/recordings/$STREAM_ID/$FILENAME \
    --endpoint-url $S3_ENDPOINT \
    --region $S3_REGION

if [ $? -eq 0 ]; then
    echo "$(date): 업로드 성공 - $FILENAME" >> /var/log/antmedia/s3-upload.log
    
    # API 호출하여 DB 업데이트 (선택사항)
    # curl -X POST http://localhost:3000/api/recordings \
    #     -H "Content-Type: application/json" \
    #     -d "{\"streamId\":\"$STREAM_ID\",\"filename\":\"$FILENAME\",\"s3Url\":\"$S3_ENDPOINT/$S3_BUCKET_NAME/recordings/$STREAM_ID/$FILENAME\"}"
else
    echo "$(date): 업로드 실패 - $FILENAME" >> /var/log/antmedia/s3-upload.log
fi
EOF

chmod +x /usr/local/bin/upload-recording-to-s3.sh

# S3 환경 변수 파일 생성
mkdir -p /etc/antmedia
cat > /etc/antmedia/s3.env <<EOF
export AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$S3_SECRET_KEY
export S3_BUCKET_NAME=$S3_BUCKET_NAME
export S3_ENDPOINT=$S3_ENDPOINT
export S3_REGION=$S3_REGION
EOF
chmod 600 /etc/antmedia/s3.env

# 로그 디렉토리 생성
mkdir -p /var/log/antmedia
touch /var/log/antmedia/s3-upload.log

echo ""
echo "================================================"
echo -e "${GREEN}✅ S3 설정 완료!${NC}"
echo "================================================"
echo ""
echo "📌 설정 정보:"
echo "   애플리케이션: $APP_NAME"
echo "   버킷: $S3_BUCKET_NAME"
echo "   엔드포인트: $S3_ENDPOINT"
echo ""
echo "📌 테스트 명령어:"
echo "   S3 연결 테스트: /usr/local/bin/test-s3-upload.sh"
echo ""
echo "📌 녹화 파일 위치:"
echo "   로컬: /usr/local/antmedia/webapps/$APP_NAME/streams/"
echo "   S3: s3://$S3_BUCKET_NAME/recordings/"
echo ""
echo "📌 로그 확인:"
echo "   tail -f /var/log/antmedia/s3-upload.log"
echo ""
echo "================================================"

success "모든 설정이 완료되었습니다!"