/**
 * User API 통합 테스트 + 유닛 테스트
 * - GET/PATCH /users/me
 * - PATCH /users/me/password
 * - GET /users/me/products
 * - GET /users/me/likes
 * - GET/PATCH /users/me/notifications
 * - GET /users/me/notifications/unread-count
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express from 'express';
import userRouter from '../src/routers/userRoutes';
import { defaultNotFoundHandler, globalErrorHandler } from '../src/controllers/errorController';

const prisma = new PrismaClient();

// userRoutes를 포함한 테스트용 앱 구성 (server.ts에 없으므로)
const app = express();
app.use(express.json());
app.use('/users', userRouter);
app.use(defaultNotFoundHandler);
app.use(globalErrorHandler);

const TEST_EMAIL = `user_test_${Date.now()}@example.com`;
let testUserId: number;
let accessToken: string;
let productId: number;
let articleId: number;
let notificationId: number;

beforeAll(async () => {
  const hashed = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: { email: TEST_EMAIL, nickname: 'UserTester', password: hashed },
  });
  testUserId = user.id;

  accessToken = jwt.sign(
    { id: testUserId },
    process.env.JWT_SECRET || 'access_secret',
    { expiresIn: '1h' }
  );

  // 테스트용 상품 생성
  const product = await prisma.product.create({
    data: {
      name: '내 상품',
      description: '설명',
      price: 5000,
      tags: [],
      images: [],
      userId: testUserId,
    },
  });
  productId = product.id;

  // 테스트용 게시글 생성
  const article = await prisma.article.create({
    data: { title: '내 게시글', content: '내용', userId: testUserId },
  });
  articleId = article.id;

  // 테스트용 알림 생성
  const notification = await prisma.notification.create({
    data: {
      type: 'COMMENT',
      message: '테스트 알림',
      userId: testUserId,
    },
  });
  notificationId = notification.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { userId: testUserId } }).catch(() => {});
  await prisma.articleLike.deleteMany({ where: { userId: testUserId } }).catch(() => {});
  await prisma.productLike.deleteMany({ where: { userId: testUserId } }).catch(() => {});
  await prisma.article.deleteMany({ where: { userId: testUserId } }).catch(() => {});
  await prisma.product.deleteMany({ where: { userId: testUserId } }).catch(() => {});
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  await prisma.$disconnect();
});

// ══════════════════════════════════════════════════════════════════
describe('[User API] 인증 필요 테스트', () => {
// ══════════════════════════════════════════════════════════════════

  // ── 내 정보 조회 ──────────────────────────────────────────────
  describe('GET /users/me - 내 정보 조회', () => {
    it('토큰 없이 요청 → 401', async () => {
      const res = await request(app).get('/users/me');
      expect(res.status).toBe(401);
    });

    it('인증 후 내 정보 반환 → password 미포함', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testUserId);
      expect(res.body.email).toBe(TEST_EMAIL);
      expect(res.body).not.toHaveProperty('password');
    });
  });

  // ── 내 정보 수정 ──────────────────────────────────────────────
  describe('PATCH /users/me - 내 정보 수정', () => {
    it('닉네임 수정 → 200 + 수정된 nickname 반환', async () => {
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nickname: '수정된닉네임' });

      expect(res.status).toBe(200);
      expect(res.body.nickname).toBe('수정된닉네임');
      expect(res.body).not.toHaveProperty('password');
    });

    it('image URL 수정 → 200', async () => {
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ image: 'https://example.com/avatar.jpg' });

      expect(res.status).toBe(200);
      expect(res.body.image).toBe('https://example.com/avatar.jpg');
    });
  });

  // ── 비밀번호 변경 ─────────────────────────────────────────────
  describe('PATCH /users/me/password - 비밀번호 변경', () => {
    it('현재 비밀번호 불일치 → 401', async () => {
      const res = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('newPassword 8자 미만 → 400', async () => {
      const res = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'password123', newPassword: '1234567' });

      expect(res.status).toBe(400);
    });

    it('올바른 현재 비밀번호 + 유효한 새 비밀번호 → 200', async () => {
      const res = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'password123', newPassword: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');

      // DB에서 직접 비밀번호 업데이트 (이후 테스트 영향 방지)
      const hashed = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { id: testUserId },
        data: { password: hashed },
      });
    });
  });

  // ── 내 상품 목록 ──────────────────────────────────────────────
  describe('GET /users/me/products - 내 상품 목록', () => {
    it('내 상품 목록 → 200 + list, totalCount', async () => {
      const res = await request(app)
        .get('/users/me/products')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('totalCount');
      expect(Array.isArray(res.body.list)).toBe(true);
      expect(res.body.totalCount).toBeGreaterThanOrEqual(1);
    });

    it('pageSize=1 → list 길이 1', async () => {
      const res = await request(app)
        .get('/users/me/products?pageSize=1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeLessThanOrEqual(1);
    });
  });

  // ── 내 좋아요 목록 ────────────────────────────────────────────
  describe('GET /users/me/likes - 내 좋아요 목록', () => {
    beforeAll(async () => {
      // 좋아요 데이터 생성
      await prisma.productLike.create({
        data: { userId: testUserId, productId },
      });
      await prisma.articleLike.create({
        data: { userId: testUserId, articleId },
      });
    });

    it('상품 좋아요 목록 → 200 + list', async () => {
      const res = await request(app)
        .get('/users/me/likes?type=product')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('게시글 좋아요 목록 → 200 + list', async () => {
      const res = await request(app)
        .get('/users/me/likes?type=article')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('type 없으면 기본값 product → 200', async () => {
      const res = await request(app)
        .get('/users/me/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it('잘못된 type → 400', async () => {
      const res = await request(app)
        .get('/users/me/likes?type=invalid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ── 알림 목록 ─────────────────────────────────────────────────
  describe('GET /users/me/notifications - 알림 목록', () => {
    it('알림 목록 → 200 + list, totalCount', async () => {
      const res = await request(app)
        .get('/users/me/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('totalCount');
      expect(Array.isArray(res.body.list)).toBe(true);
    });
  });

  // ── 읽지 않은 알림 개수 ───────────────────────────────────────
  describe('GET /users/me/notifications/unread-count - 미읽 알림 수', () => {
    it('미읽 알림 개수 → 200 + count', async () => {
      const res = await request(app)
        .get('/users/me/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(typeof res.body.count).toBe('number');
    });
  });

  // ── 모든 알림 읽음 처리 ───────────────────────────────────────
  describe('PATCH /users/me/notifications - 모든 알림 읽음', () => {
    it('전체 읽음 처리 → 200', async () => {
      const res = await request(app)
        .patch('/users/me/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('처리 후 미읽 알림 개수 0 확인', async () => {
      const res = await request(app)
        .get('/users/me/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  // ── 단일 알림 읽음 처리 ───────────────────────────────────────
  describe('PATCH /users/me/notifications/:id - 단일 알림 읽음', () => {
    it('존재하는 알림 읽음 처리 → 200', async () => {
      const res = await request(app)
        .patch(`/users/me/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it('존재하지 않는 알림 → 404', async () => {
      const res = await request(app)
        .patch('/users/me/notifications/999999999')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});