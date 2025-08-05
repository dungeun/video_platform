#!/bin/bash
# Coolify-PowerDNS 자동 서브도메인 생성 스크립트

# 설정
POWERDNS_API_URL="http://158.247.233.83:8081/api/v1"
POWERDNS_API_KEY="your-powerdns-api-key"
DOMAIN="video.one-q.xyz"
ZONE_ID="video.one-q.xyz."

# Coolify에서 받은 데이터
PROJECT_NAME=$1
PROJECT_ID=$2
SERVER_IP=$3

# 서브도메인 생성
SUBDOMAIN="${PROJECT_NAME}.${DOMAIN}"

# PowerDNS API로 A 레코드 생성
create_dns_record() {
    curl -X PATCH \
        -H "X-API-Key: ${POWERDNS_API_KEY}" \
        -H "Content-Type: application/json" \
        -d '{
            "rrsets": [{
                "name": "'${SUBDOMAIN}'.",
                "type": "A",
                "ttl": 300,
                "changetype": "REPLACE",
                "records": [{
                    "content": "'${SERVER_IP}'",
                    "disabled": false
                }]
            }]
        }' \
        "${POWERDNS_API_URL}/servers/localhost/zones/${ZONE_ID}"
}

# 와일드카드 서브도메인 설정 (선택사항)
create_wildcard_record() {
    curl -X PATCH \
        -H "X-API-Key: ${POWERDNS_API_KEY}" \
        -H "Content-Type: application/json" \
        -d '{
            "rrsets": [{
                "name": "*.'${SUBDOMAIN}'.",
                "type": "A",
                "ttl": 300,
                "changetype": "REPLACE",
                "records": [{
                    "content": "'${SERVER_IP}'",
                    "disabled": false
                }]
            }]
        }' \
        "${POWERDNS_API_URL}/servers/localhost/zones/${ZONE_ID}"
}

# 실행
echo "Creating DNS record for ${SUBDOMAIN}..."
create_dns_record

# 결과 확인
if [ $? -eq 0 ]; then
    echo "✅ DNS record created successfully: ${SUBDOMAIN} -> ${SERVER_IP}"
    
    # Coolify에 도메인 정보 업데이트 (선택사항)
    # curl -X POST ... (Coolify API 호출)
else
    echo "❌ Failed to create DNS record"
    exit 1
fi