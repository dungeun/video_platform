#!/bin/bash

# SSL 인증서 및 Nginx 설정 스크립트

set -e

echo "🔐 SSL 인증서 및 Nginx 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 서버 정보
APP_SERVER_IP="158.247.203.55"
STREAMING_SERVER_IP="141.164.42.213"
STORAGE_SERVER_IP="64.176.226.119"

# 도메인 정보 (실제 도메인으로 변경 필요)
DOMAIN="videopick.kr"
EMAIL="admin@videopick.kr"

echo -e "${YELLOW}📱 앱 서버에 Nginx 및 SSL 설정...${NC}"
ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP << EOF
# Nginx 및 Certbot 설치
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Nginx 설정 파일 생성
cat > /etc/nginx/sites-available/videopick << 'NGINX'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Let's Encrypt 인증용
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 모든 HTTP 트래픽을 HTTPS로 리다이렉트
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL 인증서 (Let's Encrypt가 생성할 위치)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 최대 업로드 크기 (5GB)
    client_max_body_size 5G;
    client_body_timeout 300s;

    # Next.js 앱 프록시
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket (Centrifugo)
    location /connection {
        proxy_pass http://localhost:8000/connection;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # HLS 스트리밍 프록시
    location /stream/ {
        proxy_pass http://$STREAMING_SERVER_IP:8888/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS 헤더
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range" always;
        add_header Access-Control-Expose-Headers "Content-Length, Content-Range" always;
    }

    # TUS 업로드 프록시
    location /upload/ {
        proxy_pass http://$STORAGE_SERVER_IP:1080/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Tus-Resumable "1.0.0";
        
        # TUS 헤더
        proxy_set_header X-HTTP-Method-Override \$http_x_http_method_override;
        proxy_request_buffering off;
        client_max_body_size 5G;
    }

    # MinIO S3 API 프록시
    location /s3/ {
        proxy_pass http://$STORAGE_SERVER_IP:9000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 5G;
    }
}
NGINX

# 임시 HTTP 설정 (SSL 인증서 발급용)
cat > /etc/nginx/sites-available/videopick-temp << 'NGINX_TEMP'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_TEMP

# 임시 설정 활성화
ln -sf /etc/nginx/sites-available/videopick-temp /etc/nginx/sites-enabled/videopick
rm -f /etc/nginx/sites-enabled/default

# Nginx 테스트 및 재시작
nginx -t
systemctl restart nginx

echo "✅ Nginx 설정 완료"
echo ""
echo "⚠️  중요: SSL 인증서 발급 전 DNS 설정이 필요합니다!"
echo ""
echo "📌 DNS 설정 방법:"
echo "   1. 도메인 관리 페이지에서 다음 레코드 추가:"
echo "      - A 레코드: $DOMAIN → $APP_SERVER_IP"
echo "      - A 레코드: www.$DOMAIN → $APP_SERVER_IP"
echo "      - A 레코드: stream.$DOMAIN → $STREAMING_SERVER_IP"
echo "      - A 레코드: storage.$DOMAIN → $STORAGE_SERVER_IP"
echo ""
echo "   2. DNS 전파 확인 (약 5-30분 소요):"
echo "      nslookup $DOMAIN"
echo ""
echo "   3. SSL 인증서 발급 명령어:"
echo "      certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL"
echo ""
echo "   4. SSL 설정 활성화:"
echo "      ln -sf /etc/nginx/sites-available/videopick /etc/nginx/sites-enabled/videopick"
echo "      systemctl reload nginx"
EOF

# 스트리밍 서버 Nginx 설정
echo -e "\n${YELLOW}🎥 스트리밍 서버 Nginx 설정...${NC}"
ssh -o StrictHostKeyChecking=no root@$STREAMING_SERVER_IP << EOF
apt-get update
apt-get install -y nginx

# 스트리밍 서버 Nginx 설정
cat > /etc/nginx/sites-available/streaming << 'NGINX'
server {
    listen 80;
    server_name stream.$DOMAIN;

    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        
        # CORS 헤더
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range" always;
        add_header Access-Control-Expose-Headers "Content-Length, Content-Range" always;
        
        # 캐시 비활성화 (라이브 스트리밍)
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    location /rtmp/stat {
        proxy_pass http://localhost:9997/v3/rtmp/conns;
        proxy_http_version 1.1;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/streaming /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "✅ 스트리밍 서버 Nginx 설정 완료"
EOF

# 스토리지 서버 Nginx 설정
echo -e "\n${YELLOW}💾 스토리지 서버 Nginx 설정...${NC}"
ssh -o StrictHostKeyChecking=no root@$STORAGE_SERVER_IP << EOF
apt-get update
apt-get install -y nginx

# 스토리지 서버 Nginx 설정
cat > /etc/nginx/sites-available/storage << 'NGINX'
server {
    listen 80;
    server_name storage.$DOMAIN;

    client_max_body_size 5G;
    proxy_request_buffering off;

    # TUS Upload
    location /upload/ {
        proxy_pass http://localhost:1080/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Tus-Resumable "1.0.0";
        
        # CORS
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "POST, PATCH, HEAD, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Tus-Resumable, Upload-Length, Upload-Offset, Content-Type" always;
        add_header Access-Control-Expose-Headers "Upload-Offset, Location" always;
    }

    # MinIO S3 API
    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/storage /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "✅ 스토리지 서버 Nginx 설정 완료"
EOF

echo -e "\n${GREEN}🎉 Nginx 설정이 완료되었습니다!${NC}"
echo ""
echo "📋 현재 상태:"
echo "  ✅ Nginx 설치 및 설정 완료"
echo "  ✅ HTTP (포트 80) 접속 가능"
echo "  ⏳ SSL 인증서 발급 대기 (DNS 설정 필요)"
echo ""
echo "🌐 DNS 설정 안내:"
echo "  도메인 제공업체에서 다음 A 레코드를 추가하세요:"
echo ""
echo "  | 타입 | 호스트 | 값 |"
echo "  |------|--------|-----|"
echo "  | A | @ | $APP_SERVER_IP |"
echo "  | A | www | $APP_SERVER_IP |"
echo "  | A | stream | $STREAMING_SERVER_IP |"
echo "  | A | storage | $STORAGE_SERVER_IP |"
echo ""
echo "📌 DNS 설정 후 SSL 인증서 발급:"
echo "  ssh root@$APP_SERVER_IP"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL"