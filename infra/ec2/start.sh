#!/bin/bash
# ─────────────────────────────────────────────────────────────
# EC2 배포 스크립트 (Ubuntu 기준)
# 실행 전: chmod +x start.sh
# ─────────────────────────────────────────────────────────────

set -e  # 에러 발생 시 즉시 중단

echo "🚀 판다마켓 서버 배포 시작..."

# 1. 의존성 설치
echo "📦 패키지 설치 중..."
npm install

# 2. Prisma 클라이언트 생성
echo "🔧 Prisma 클라이언트 생성 중..."
npx prisma generate

# 3. DB 마이그레이션
echo "🗄️  DB 마이그레이션 실행 중..."
npx prisma migrate deploy

# 4. TypeScript 빌드
echo "🏗️  TypeScript 빌드 중..."
npx tsc

# 5. pm2로 서버 실행 (프로덕션 환경)
echo "⚙️  pm2 시작..."
npx pm2 start ecosystem.config.js --env production

# pm2 프로세스 목록 저장 (재부팅 후 자동 실행 설정)
npx pm2 save

echo "✅ 배포 완료!"
npx pm2 status