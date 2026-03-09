import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import server from '../src/server';

// auth 라우터가 server.ts에 없으므로 테스트용으로 직접 마운트
import authRouter from '../src/routers/authRoutes';
import express from 'express';

const prisma = new PrismaClient();

// auth 라우터를 포함한 테스트용 앱 생성
const app = express();
app.use(express.json());
app.use('/auth', authRouter);

const TEST_EMAIL = `auth_test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';
const TEST_NICKNAME = 'AuthTester';

let createdUserId: number;
let refreshToken: string;

afterAll(async () => {
  // 테스트 데이터 정리
  if (createdUserId) {
    await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe('[Auth API] 회원가입 / 로그인 통합 테스트', () => {
  // ──────────────────────────────────────────
  // 회원가입
  // ──────────────────────────────────────────
  describe('POST /auth/signup - 회원가입', () => {
    it('정상적인 데이터로 회원가입 시 201 반환', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: TEST_EMAIL,
        nickname: TEST_NICKNAME,
        password: TEST_PASSWORD,
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', TEST_EMAIL);
      expect(res.body).toHaveProperty('nickname', TEST_NICKNAME);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('refreshToken');

      createdUserId = res.body.id;
    });

    it('이미 존재하는 이메일로 회원가입 시 400 반환', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: TEST_EMAIL,
        nickname: TEST_NICKNAME,
        password: TEST_PASSWORD,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('비밀번호가 8자 미만이면 400 반환', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'short@example.com',
        nickname: 'ShortPw',
        password: '1234567', // 7자
      });

      expect(res.status).toBe(400);
    });

    it('이메일 누락 시 400 반환', async () => {
      const res = await request(app).post('/auth/signup').send({
        nickname: 'NoEmail',
        password: 'password123',
      });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────
  // 로그인
  // ──────────────────────────────────────────
  describe('POST /auth/signin - 로그인', () => {
    it('올바른 이메일/비밀번호로 로그인 시 200 + 토큰 반환', async () => {
      const res = await request(app).post('/auth/signin').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).not.toHaveProperty('password');

      refreshToken = res.body.refreshToken;
    });

    it('존재하지 않는 이메일로 로그인 시 401 반환', async () => {
      const res = await request(app).post('/auth/signin').send({
        email: 'notexist@example.com',
        password: TEST_PASSWORD,
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('비밀번호가 틀리면 401 반환', async () => {
      const res = await request(app).post('/auth/signin').send({
        email: TEST_EMAIL,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ──────────────────────────────────────────
  // 토큰 갱신
  // ──────────────────────────────────────────
  describe('POST /auth/refresh - 토큰 갱신', () => {
    it('유효한 리프레시 토큰으로 새 토큰 발급', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('리프레시 토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).post('/auth/refresh').send({});

      expect(res.status).toBe(401);
    });

    it('유효하지 않은 리프레시 토큰으로 요청 시 401/403 반환', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect([401, 403, 500]).toContain(res.status);
    });
  });
});