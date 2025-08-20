# VideoPick Platform - Terraform 메인 설정
# Phase 2: 1,000명 동접 인프라

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    vultr = {
      source  = "vultr/vultr"
      version = "~> 2.0"
    }
  }
}

# Vultr Provider 설정
provider "vultr" {
  api_key = var.vultr_api_key
  rate_limit = 100
  retry_limit = 3
}

# 변수 선언
variable "vultr_api_key" {
  description = "Vultr API Key"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Vultr region"
  type        = string
  default     = "icn"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "videopick-phase2"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "app_server_plan" {
  description = "App server plan"
  type        = string
  default     = "vc2-6c-16gb"
}

variable "streaming_server_plan" {
  description = "Streaming server plan"
  type        = string
  default     = "vc2-6c-16gb"
}

variable "storage_server_plan" {
  description = "Storage server plan"
  type        = string
  default     = "vc2-6c-16gb"
}

variable "backup_server_plan" {
  description = "Backup server plan"
  type        = string
  default     = "vc2-4c-8gb"
}

variable "os_id" {
  description = "Operating System ID"
  type        = string
  default     = "1743"
}

# SSH 키 생성
resource "vultr_ssh_key" "main" {
  name    = "${var.project_name}-key"
  ssh_key = file("~/.ssh/id_rsa.pub")
}

# VPC 네트워크 생성
resource "vultr_vpc" "main" {
  description     = "${var.project_name} VPC"
  region         = var.region
  v4_subnet      = "10.0.0.0"
  v4_subnet_mask = 24
}

# 방화벽 그룹 생성
resource "vultr_firewall_group" "app" {
  description = "${var.project_name} App Server Firewall"
}

resource "vultr_firewall_group" "streaming" {
  description = "${var.project_name} Streaming Server Firewall"
}

resource "vultr_firewall_group" "storage" {
  description = "${var.project_name} Storage Server Firewall"
}

# 앱 서버 방화벽 규칙
resource "vultr_firewall_rule" "app_ssh" {
  firewall_group_id = vultr_firewall_group.app.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "22"
  notes            = "SSH"
}

resource "vultr_firewall_rule" "app_http" {
  firewall_group_id = vultr_firewall_group.app.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "80"
  notes            = "HTTP"
}

resource "vultr_firewall_rule" "app_https" {
  firewall_group_id = vultr_firewall_group.app.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "443"
  notes            = "HTTPS"
}

resource "vultr_firewall_rule" "app_nextjs" {
  firewall_group_id = vultr_firewall_group.app.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "3000"
  notes            = "Next.js"
}

resource "vultr_firewall_rule" "app_centrifugo" {
  firewall_group_id = vultr_firewall_group.app.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "8000"
  notes            = "Centrifugo WebSocket"
}

# 스트리밍 서버 방화벽 규칙
resource "vultr_firewall_rule" "streaming_ssh" {
  firewall_group_id = vultr_firewall_group.streaming.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "22"
  notes            = "SSH"
}

resource "vultr_firewall_rule" "streaming_rtmp" {
  firewall_group_id = vultr_firewall_group.streaming.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "1935"
  notes            = "RTMP"
}

resource "vultr_firewall_rule" "streaming_hls" {
  firewall_group_id = vultr_firewall_group.streaming.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "8888"
  notes            = "HLS"
}

resource "vultr_firewall_rule" "streaming_webrtc" {
  firewall_group_id = vultr_firewall_group.streaming.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "8889"
  notes            = "WebRTC"
}

# 스토리지 서버 방화벽 규칙
resource "vultr_firewall_rule" "storage_ssh" {
  firewall_group_id = vultr_firewall_group.storage.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "22"
  notes            = "SSH"
}

resource "vultr_firewall_rule" "storage_tus" {
  firewall_group_id = vultr_firewall_group.storage.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "1080"
  notes            = "TUS Upload"
}

resource "vultr_firewall_rule" "storage_minio" {
  firewall_group_id = vultr_firewall_group.storage.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "9000-9001"
  notes            = "MinIO"
}

# 앱 서버 (Next.js + PostgreSQL + Redis + Centrifugo)
resource "vultr_instance" "app_server" {
  label             = "${var.project_name}-app"
  plan              = var.app_server_plan
  region            = var.region
  os_id             = var.os_id
  enable_ipv6       = false
  backups           = "enabled"
  
  backups_schedule {
    type = "daily"
    hour = 3
  }
  ddos_protection   = false
  activation_email  = false
  hostname          = "${var.project_name}-app"
  firewall_group_id = vultr_firewall_group.app.id
  vpc_ids           = [vultr_vpc.main.id]
  ssh_key_ids       = [vultr_ssh_key.main.id]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl enable docker
    systemctl start docker
  EOF

  tags = [
    "videopick",
    "app-server",
    "phase2"
  ]
}

# 스트리밍 서버 (MediaMTX + FFmpeg)
resource "vultr_instance" "streaming_server" {
  label             = "${var.project_name}-streaming"
  plan              = var.streaming_server_plan
  region            = var.region
  os_id             = var.os_id
  enable_ipv6       = false
  backups           = "enabled"
  
  backups_schedule {
    type = "daily"
    hour = 3
  }
  ddos_protection   = false
  activation_email  = false
  hostname          = "${var.project_name}-streaming"
  firewall_group_id = vultr_firewall_group.streaming.id
  vpc_ids           = [vultr_vpc.main.id]
  ssh_key_ids       = [vultr_ssh_key.main.id]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose ffmpeg
    systemctl enable docker
    systemctl start docker
  EOF

  tags = [
    "videopick",
    "streaming-server",
    "phase2"
  ]
}

# 스토리지 서버 (TUS + MinIO)
resource "vultr_instance" "storage_server" {
  label             = "${var.project_name}-storage"
  plan              = var.storage_server_plan
  region            = var.region
  os_id             = var.os_id
  enable_ipv6       = false
  backups           = "enabled"
  
  backups_schedule {
    type = "daily"
    hour = 3
  }
  ddos_protection   = false
  activation_email  = false
  hostname          = "${var.project_name}-storage"
  firewall_group_id = vultr_firewall_group.storage.id
  vpc_ids           = [vultr_vpc.main.id]
  ssh_key_ids       = [vultr_ssh_key.main.id]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl enable docker
    systemctl start docker
  EOF

  tags = [
    "videopick",
    "storage-server",
    "phase2"
  ]
}

# 백업 서버 (데이터 백업 및 재해 복구)
resource "vultr_instance" "backup_server" {
  label             = "${var.project_name}-backup"
  plan              = var.backup_server_plan
  region            = var.region
  os_id             = var.os_id
  enable_ipv6       = false
  backups           = "enabled"
  
  backups_schedule {
    type = "daily"
    hour = 4
  }
  ddos_protection   = false
  activation_email  = false
  hostname          = "${var.project_name}-backup"
  firewall_group_id = vultr_firewall_group.storage.id
  vpc_ids           = [vultr_vpc.main.id]
  ssh_key_ids       = [vultr_ssh_key.main.id]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose rsync postgresql-client
    systemctl enable docker
    systemctl start docker
  EOF

  tags = [
    "videopick",
    "backup-server",
    "phase2"
  ]
}

# 출력
output "app_server_ip" {
  value       = vultr_instance.app_server.main_ip
  description = "App Server Public IP"
}

output "streaming_server_ip" {
  value       = vultr_instance.streaming_server.main_ip
  description = "Streaming Server Public IP"
}

output "storage_server_ip" {
  value       = vultr_instance.storage_server.main_ip
  description = "Storage Server Public IP"
}

output "backup_server_ip" {
  value       = vultr_instance.backup_server.main_ip
  description = "Backup Server Public IP"
}

output "vpc_subnet" {
  value       = vultr_vpc.main.v4_subnet
  description = "VPC Subnet"
}

output "total_monthly_cost" {
  value       = "$280/month (App: $80 + Streaming: $80 + Storage: $80 + Backup: $40)"
  description = "Estimated Monthly Cost"
}