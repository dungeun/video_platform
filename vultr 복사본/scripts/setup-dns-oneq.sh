#!/bin/bash

# one-q.xyz 도메인을 위한 DNS 설정 스크립트

set -e

echo "🌐 one-q.xyz DNS 서브도메인 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 서버 정보
NAMESERVER_IP="141.164.60.51"
APP_SERVER_IP="158.247.203.55"
STREAMING_SERVER_IP="141.164.42.213"
STORAGE_SERVER_IP="64.176.226.119"
BACKUP_SERVER_IP="141.164.37.63"

# 도메인 정보
DOMAIN="one-q.xyz"
EMAIL="admin@one-q.xyz"

echo -e "${YELLOW}📋 DNS 레코드 설정 정보:${NC}"
echo "  - main.$DOMAIN → $APP_SERVER_IP"
echo "  - stream.$DOMAIN → $STREAMING_SERVER_IP" 
echo "  - storage.$DOMAIN → $STORAGE_SERVER_IP"
echo "  - monitor.$DOMAIN → $APP_SERVER_IP"
echo ""

# 네임서버에 DNS 레코드 추가
echo -e "${YELLOW}🌐 네임서버 ($NAMESERVER_IP)에 DNS 레코드 추가...${NC}"
ssh -o StrictHostKeyChecking=no root@$NAMESERVER_IP << 'EOF'
# DNS 프로그램이 BIND9인지 확인
if command -v named-checkconf >/dev/null 2>&1; then
    echo "✅ BIND9 DNS 서버 확인됨"
    
    # one-q.xyz 존 파일 백업
    if [ -f /etc/bind/db.one-q.xyz ]; then
        cp /etc/bind/db.one-q.xyz /etc/bind/db.one-q.xyz.backup.$(date +%Y%m%d_%H%M%S)
        echo "📁 기존 존 파일 백업 완료"
    fi
    
    # 존 파일 업데이트
    cat > /etc/bind/db.one-q.xyz << 'ZONE'
$TTL    604800
@       IN      SOA     one-q.xyz. admin.one-q.xyz. (
                              2024012001         ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL
;
@       IN      NS      ns1.one-q.xyz.
@       IN      A       141.164.60.51
ns1     IN      A       141.164.60.51

; VideoPick 플랫폼 서브도메인
main    IN      A       158.247.203.55
stream  IN      A       141.164.42.213
storage IN      A       64.176.226.119
monitor IN      A       158.247.203.55
ZONE

    # named.conf.local에 존 설정이 있는지 확인
    if ! grep -q "zone \"one-q.xyz\"" /etc/bind/named.conf.local; then
        cat >> /etc/bind/named.conf.local << 'NAMEDCONF'

zone "one-q.xyz" {
    type master;
    file "/etc/bind/db.one-q.xyz";
};
NAMEDCONF
        echo "✅ 존 설정이 named.conf.local에 추가됨"
    else
        echo "✅ 존 설정이 이미 존재함"
    fi
    
    # 설정 파일 구문 확인
    named-checkconf
    named-checkzone one-q.xyz /etc/bind/db.one-q.xyz
    
    # BIND9 재시작
    systemctl reload bind9
    echo "✅ BIND9 DNS 서버 재로드 완료"
    
elif command -v pdns_server >/dev/null 2>&1; then
    echo "✅ PowerDNS 서버 확인됨"
    
    # PowerDNS MySQL 데이터베이스에 레코드 추가
    mysql -u pdns -p pdns << 'SQL'
DELETE FROM records WHERE name LIKE '%one-q.xyz';

INSERT INTO domains (name, type) VALUES ('one-q.xyz', 'NATIVE') ON DUPLICATE KEY UPDATE type='NATIVE';

INSERT INTO records (domain_id, name, type, content, ttl, prio) VALUES
((SELECT id FROM domains WHERE name='one-q.xyz'), 'one-q.xyz', 'SOA', 'ns1.one-q.xyz admin.one-q.xyz 2024012001 604800 86400 2419200 604800', 604800, NULL),
((SELECT id FROM domains WHERE name='one-q.xyz'), 'one-q.xyz', 'NS', 'ns1.one-q.xyz', 604800, NULL),
((SELECT id FROM domains WHERE name='one-q.xyz'), 'ns1.one-q.xyz', 'A', '141.164.60.51', 604800, NULL),
((SELECT id FROM domains WHERE name='one-q.xyz'), 'main.one-q.xyz', 'A', '158.247.203.55', 300, NULL),
((SELECT id FROM domains WHERE name='one-q.xyz'), 'stream.one-q.xyz', 'A', '141.164.42.213', 300, NULL),
((SELECT id FROM domains WHERE name='one-q.xyz'), 'storage.one-q.xyz', 'A', '64.176.226.119', 300, NULL),
((SELECT id FROM domains WHERE name='one-q.xyz'), 'monitor.one-q.xyz', 'A', '158.247.203.55', 300, NULL);
SQL
    
    systemctl restart pdns
    echo "✅ PowerDNS 서버 재시작 완료"
    
else
    echo "❌ DNS 서버 프로그램을 찾을 수 없습니다."
    echo "수동으로 다음 DNS 레코드를 추가해주세요:"
    echo "main.one-q.xyz    A    158.247.203.55"
    echo "stream.one-q.xyz  A    141.164.42.213"
    echo "storage.one-q.xyz A    64.176.226.119"
    echo "monitor.one-q.xyz A    158.247.203.55"
fi
EOF

echo -e "\n${YELLOW}📱 앱 서버 Nginx 설정 업데이트...${NC}"
ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP << 'EOF'
# 기존 설정 백업
cp /etc/nginx/sites-available/videopick-temp /etc/nginx/sites-available/videopick-temp.backup

# one-q.xyz용 Nginx 설정 생성
cat > /etc/nginx/sites-available/oneq-videopick << 'NGINX'
server {
    listen 80;
    server_name main.one-q.xyz;

    # Let's Encrypt 인증용
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 모든 HTTP 트래픽을 HTTPS로 리다이렉트 (SSL 인증서 발급 후)
    # location / {
    #     return 301 https://$server_name$request_uri;
    # }

    # 임시로 HTTP로 서비스 (SSL 인증서 발급 전)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (Centrifugo)
    location /connection {
        proxy_pass http://localhost:8000/connection;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # HLS 스트리밍 프록시
    location /stream/ {
        proxy_pass http://141.164.42.213:8888/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 헤더
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range" always;
        add_header Access-Control-Expose-Headers "Content-Length, Content-Range" always;
    }

    # TUS 업로드 프록시
    location /upload/ {
        proxy_pass http://64.176.226.119:1080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Tus-Resumable "1.0.0";
        proxy_request_buffering off;
        client_max_body_size 5G;
    }
}

# 모니터링 서브도메인
server {
    listen 80;
    server_name monitor.one-q.xyz;

    # Grafana
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Prometheus
    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# 새 설정 활성화
ln -sf /etc/nginx/sites-available/oneq-videopick /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "✅ 앱 서버 Nginx one-q.xyz 설정 완료"
EOF

echo -e "\n${YELLOW}🎥 스트리밍 서버 Nginx 설정 업데이트...${NC}"
ssh -o StrictHostKeyChecking=no root@$STREAMING_SERVER_IP << 'EOF'
cat > /etc/nginx/sites-available/oneq-streaming << 'NGINX'
server {
    listen 80;
    server_name stream.one-q.xyz;

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

ln -sf /etc/nginx/sites-available/oneq-streaming /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "✅ 스트리밍 서버 Nginx one-q.xyz 설정 완료"
EOF

echo -e "\n${YELLOW}💾 스토리지 서버 Nginx 설정 업데이트...${NC}"
ssh -o StrictHostKeyChecking=no root@$STORAGE_SERVER_IP << 'EOF'
cat > /etc/nginx/sites-available/oneq-storage << 'NGINX'
server {
    listen 80;
    server_name storage.one-q.xyz;

    client_max_body_size 5G;
    proxy_request_buffering off;

    # TUS Upload
    location /upload/ {
        proxy_pass http://localhost:1080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/oneq-storage /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "✅ 스토리지 서버 Nginx one-q.xyz 설정 완료"
EOF

# DNS 전파 확인
echo -e "\n${YELLOW}🔍 DNS 전파 확인 중...${NC}"
for SUBDOMAIN in main stream storage monitor; do
    echo -n "  $SUBDOMAIN.one-q.xyz 확인 중..."
    
    # 최대 5번 시도
    for i in {1..5}; do
        if nslookup $SUBDOMAIN.one-q.xyz 8.8.8.8 >/dev/null 2>&1; then
            echo " ✅"
            break
        elif [ $i -eq 5 ]; then
            echo " ⏳ (전파 중...)"
        else
            sleep 5
        fi
    done
done

echo -e "\n${GREEN}🎉 one-q.xyz DNS 설정이 완료되었습니다!${NC}"
echo ""
echo "🌐 서비스 접속 주소:"
echo "  - 메인 앱: http://main.one-q.xyz"
echo "  - 스트리밍: http://stream.one-q.xyz"
echo "  - 스토리지: http://storage.one-q.xyz"
echo "  - 모니터링: http://monitor.one-q.xyz"
echo ""
echo "📋 RTMP 스트리밍 정보:"
echo "  - RTMP URL: rtmp://stream.one-q.xyz/live"
echo "  - HLS URL: http://stream.one-q.xyz/{stream-key}/index.m3u8"
echo ""
echo "🔐 SSL 인증서 발급 (DNS 전파 확인 후):"
echo "  ssh root@$APP_SERVER_IP"
echo "  certbot --nginx -d main.one-q.xyz --non-interactive --agree-tos -m $EMAIL"
echo ""
echo "💡 참고사항:"
echo "  - DNS 전파에는 5-30분 소요될 수 있습니다"
echo "  - SSL 인증서는 DNS 전파 완료 후 발급하세요"
echo "  - 각 서브도메인별로 개별 SSL 인증서 발급 가능합니다"