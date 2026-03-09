import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import server from '../src/server';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────
// 테스트 데이터 준비
// ──────────────────────────────────────────────────────────────────
let testUserId: number;
let accessToken: string;
let createdProductId: number;

const TEST_EMAIL = `product_test_${Date.now()}@example.com`;

beforeAll(async () => {
  // 테스트 유저 생성
  const hashed = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: { email: TEST_EMAIL, nickname: 'ProductTester', password: hashed },
  });
  testUserId = user.id;

  // JWT 토큰 생성 (authController의 generateTokens와 동일한 payload: { id })
  accessToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'access_secret', {
    expiresIn: '1h',
  });
});

afterAll(async () => {
  await prisma.comment.deleteMany({ where: { productId: { in: [createdProductId] } } });
  await prisma.product.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  await prisma.$disconnect();
});

// ──────────────────────────────────────────────────────────────────
// 인증 불필요 API
// ──────────────────────────────────────────────────────────────────
describe('[Products API - 공개] 인증 불필요 테스트', () => {
  describe('GET /products - 상품 목록 조회', () => {
    it('200 반환 + list, totalCount 포함', async () => {
      const res = await request(server).get('/products');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('totalCount');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('keyword 쿼리로 필터링 가능', async () => {
      const res = await request(server).get('/products?keyword=없는상품명xyz');

      expect(res.status).toBe(200);
      expect(res.body.list).toHaveLength(0);
      expect(res.body.totalCount).toBe(0);
    });

    it('page, pageSize 쿼리 파라미터 적용', async () => {
      const res = await request(server).get('/products?page=1&pageSize=5');

      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeLessThanOrEqual(5);
    });

    it('orderBy=recent 정렬 가능', async () => {
      const res = await request(server).get('/products?orderBy=recent');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /products/:id - 상품 단건 조회', () => {
    it('존재하지 않는 ID 조회 시 404 반환', async () => {
      const res = await request(server).get('/products/999999999');
      expect(res.status).toBe(404);
    });

    it('유효하지 않은 ID 형식이면 400 반환', async () => {
      const res = await request(server).get('/products/notanumber');
      expect(res.status).toBe(400);
    });
  });
});

// ──────────────────────────────────────────────────────────────────
// 인증 필요 API
// ──────────────────────────────────────────────────────────────────
describe('[Products API - 인증] 인증 필요 테스트', () => {
  // ── 상품 생성 ──
  describe('POST /products - 상품 생성', () => {
    it('인증 없이 요청 시 401 반환', async () => {
      const res = await request(server).post('/products').send({
        name: '무인증 상품',
        description: '설명',
        price: 1000,
        tags: [],
        images: [],
      });
      expect(res.status).toBe(401);
    });

    it('인증 후 상품 생성 시 201 반환', async () => {
      const res = await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '테스트 상품',
          description: '테스트 상품 설명입니다.',
          price: 10000,
          tags: ['태그1', '태그2'],
          images: ['https://example.com/image.jpg'],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('테스트 상품');
      expect(res.body.price).toBe(10000);
      expect(res.body.userId).toBe(testUserId);

      createdProductId = res.body.id;
    });

    it('필수 필드 누락 시 400 반환', async () => {
      const res = await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '이름만있음' }); // description, price 등 누락

      expect(res.status).toBe(400);
    });

    it('price가 음수이면 400 반환', async () => {
      const res = await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '음수상품',
          description: '설명',
          price: -100,
          tags: [],
          images: [],
        });

      expect(res.status).toBe(400);
    });
  });

  // ── 상품 단건 조회 (생성 후) ──
  describe('GET /products/:id - 상품 단건 조회 (생성 후)', () => {
    it('생성된 상품 ID로 조회 시 200 반환', async () => {
      const res = await request(server).get(`/products/${createdProductId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdProductId);
      expect(res.body.name).toBe('테스트 상품');
    });
  });

  // ── 상품 수정 ──
  describe('PATCH /products/:id - 상품 수정', () => {
    it('인증 없이 수정 시 401 반환', async () => {
      const res = await request(server)
        .patch(`/products/${createdProductId}`)
        .send({ name: '수정된 이름' });

      expect(res.status).toBe(401);
    });

    it('본인 상품 수정 시 200 반환', async () => {
      const res = await request(server)
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '수정된 상품명', price: 20000 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('수정된 상품명');
      expect(res.body.price).toBe(20000);
    });

    it('다른 유저가 수정 시도 시 403 반환', async () => {
      // 다른 유저 토큰 생성
      const otherToken = jwt.sign(
        { id: 99999 },
        process.env.JWT_SECRET || 'access_secret',
        { expiresIn: '1h' }
      );

      const res = await request(server)
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: '해킹 시도' });

      // 유저가 DB에 없으므로 401 또는 403
      expect([401, 403]).toContain(res.status);
    });

    it('존재하지 않는 상품 수정 시 404 반환', async () => {
      const res = await request(server)
        .patch('/products/999999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '없는상품' });

      expect(res.status).toBe(404);
    });
  });

  // ── 댓글 ──
  describe('POST /products/:id/comments - 댓글 생성', () => {
    it('인증 없이 댓글 생성 시 401 반환', async () => {
      const res = await request(server)
        .post(`/products/${createdProductId}/comments`)
        .send({ content: '댓글내용' });

      expect(res.status).toBe(401);
    });

    it('인증 후 댓글 생성 시 201 반환', async () => {
      const res = await request(server)
        .post(`/products/${createdProductId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '테스트 댓글입니다.' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('테스트 댓글입니다.');
    });

    it('빈 댓글 생성 시 400 반환', async () => {
      const res = await request(server)
        .post(`/products/${createdProductId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /products/:id/comments - 댓글 목록 조회', () => {
    it('인증 없이도 댓글 목록 조회 시 401 (authenticate 미들웨어 적용됨)', async () => {
      const res = await request(server).get(`/products/${createdProductId}/comments`);
      // productsRouter는 authenticate 후 get comments → 인증 필요
      expect(res.status).toBe(401);
    });

    it('인증 후 댓글 목록 조회 시 list, nextCursor 포함', async () => {
      const res = await request(server)
        .get(`/products/${createdProductId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('nextCursor');
      expect(Array.isArray(res.body.list)).toBe(true);
    });
  });

  // ── 상품 삭제 ──
  describe('DELETE /products/:id - 상품 삭제', () => {
    it('인증 없이 삭제 시 401 반환', async () => {
      const res = await request(server).delete(`/products/${createdProductId}`);
      expect(res.status).toBe(401);
    });

    it('본인 상품 삭제 시 204 반환', async () => {
      const res = await request(server)
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });

    it('이미 삭제된 상품 삭제 시 404 반환', async () => {
      const res = await request(server)
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});