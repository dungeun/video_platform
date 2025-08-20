# VideoPick Platform - Terraform 변수 설정
# Phase 2: 1,000명 동접 서버 구성

# Vultr 지역 (서울)
region = "icn"

# 프로젝트 이름
project_name = "videopick-phase2"

# 환경
environment = "production"

# 서버 스펙 설정 (총 예산: $280/월)
app_server_plan = "vc2-6c-16gb"        # 6 vCPU, 16GB RAM, 320GB ($80/month)
streaming_server_plan = "vc2-6c-16gb"  # 6 vCPU, 16GB RAM, 320GB ($80/month)
storage_server_plan = "vc2-6c-16gb"    # 6 vCPU, 16GB RAM, 320GB ($80/month)
backup_server_plan = "vc2-4c-8gb"      # 4 vCPU, 8GB RAM, 160GB ($40/month)

# OS 이미지 (Ubuntu 22.04 LTS)
os_id = "1743"

# SSH 키 이름
ssh_key_name = "videopick-key"

# 도메인 설정 (실제 도메인으로 변경 필요)
domain = "videopick.kr"

# 백업 설정
enable_backups = true
backup_schedule = "daily"

# 모니터링 설정
enable_monitoring = true

# 네트워크 설정
enable_private_network = true
enable_ipv6 = false

# 태그
tags = [
  "videopick",
  "phase2",
  "production",
  "streaming"
]