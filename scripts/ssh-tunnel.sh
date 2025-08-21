#!/bin/bash

# SSH 터널 스크립트 - 원격 PostgreSQL 데이터베이스 연결

echo "원격 PostgreSQL 서버에 SSH 터널 생성 중..."

# 기존 SSH 터널 프로세스 종료
pkill -f "ssh.*5433:localhost:5432.*158.247.203.55" 2>/dev/null

# SSH 터널 생성 (백그라운드)
# 로컬 5433 포트를 원격 서버의 5432 포트로 포워딩
ssh -N -L 5433:localhost:5432 root@158.247.203.55 \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes &

SSH_PID=$!
echo "SSH 터널 프로세스 PID: $SSH_PID"

# 터널이 성공적으로 열렸는지 확인
sleep 2
if ps -p $SSH_PID > /dev/null; then
    echo "✅ SSH 터널이 성공적으로 생성되었습니다."
    echo "로컬 포트 5433 -> 원격 PostgreSQL 5432"
    echo ""
    echo "터널을 종료하려면: kill $SSH_PID"
    echo "또는: npm run tunnel:stop"
else
    echo "❌ SSH 터널 생성 실패"
    echo "SSH 키가 설정되어 있는지 확인하세요."
    exit 1
fi