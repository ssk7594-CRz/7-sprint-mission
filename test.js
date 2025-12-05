// |**주요 작업**|**구체적인 구현 지침 (Instructions)**|
// |**Prisma 초기 설정**|
// 1. `npm init -y` 후 `express`, `dotenv`, **`prisma`**, **`@prisma/client`** 설치
// 2.`npx prisma init`을 실행하여 `prisma` 폴더와 `schema.prisma` 파일 생성.<br><br>
// 3. `.env` 파일에 **`DATABASE_URL`** (PostgreSQL 접속 정보) 설정 및 `PORT` 정의.|

// |**Prisma 스키마 정의 및 시딩**|
// 1. `schema.prisma` 파일에 **`Product`** 및 **`Article`** 모델을 정의합니다
// (필수 필드: `id`, `name`/`title`, `description`/`content`, `price`, `tags`, `createdAt`, `updatedAt`)
// 2. **마이그레이션:** `npx prisma migrate dev --name init` 실행하여 DB에 테이블 생성.
// 3. **시딩 코드:** `prisma/seed.js` 파일에 **`PrismaClient`**를 사용하여 더미 데이터 삽입 로직 작성 및 실행 테스트.|

// |**라우팅 및 CRUD 구현**|
// 1. `PrismaClient`를 초기화하고 DB 작업을 전담하는 서비스 계층(`services/product.service.js` 등)을 구성.
// 2. 라우트 파일(`routes/products.js`, `routes/articles.js`)을 별도로 생성하고 `express.Router()` 인스턴스 정의.
// 3. **라우트 중복 제거:** `router.route('/')`와 `router.route('/:id')`를 사용하여 경로 통합.
// >4. **컨트롤러 함수**(`controllers/product.controller.js`) 작성 및 라우터에 연결 (등록, 상세 조회, 수정, 삭제 API 구현).|
