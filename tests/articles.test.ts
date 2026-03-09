import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import server from '../src/server';

const prisma = new PrismaClient();

let testUserId: number;
let accessToken: string;
let createdArticleId: number;

const TEST_EMAIL = `article_test_${Date.now()}@example.com`;

beforeAll(async () => {
  const hashed = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: { email: TEST_EMAIL, nickname: 'ArticleTester', password: hashed },
  });
  testUserId = user.id;

  accessToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'access_secret', {
    expiresIn: '1h',
  });
});

afterAll(async () => {
  await prisma.comment.deleteMany({ where: { articleId: { in: [createdArticleId] } } });
  await prisma.article.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  await prisma.$disconnect();
});

// ──────────────────────────────────────────────────────────────────
// 인증 불필요 API
// ──────────────────────────────────────────────────────────────────
describe('[Articles API - 공개] 인증 불필요 테스트', () => {
  describe('GET /articles - 게시글 목록 조회', () => {
    it('200 반환 + list, totalCount 포함', async () => {
      const res = await request(server).get('/articles');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('totalCount');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    it('keyword 쿼리로 필터링 가능', async () => {
      const res = await request(server).get('/articles?keyword=없는게시글xyz');

      expect(res.status).toBe(200);
      expect(res.body.list).toHaveLength(0);
    });

    it('page, pageSize 파라미터 적용', async () => {
      const res = await request(server).get('/articles?page=1&pageSize=3');

      expect(res.status).toBe(200);
      expect(res.body.list.length).toBeLessThanOrEqual(3);
    });

    it('orderBy=recent 정렬 가능', async () => {
      const res = await request(server).get('/articles?orderBy=recent');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /articles/:id - 게시글 단건 조회', () => {
    it('존재하지 않는 ID 조회 시 404 반환', async () => {
      const res = await request(server).get('/articles/999999999');
      expect(res.status).toBe(404);
    });

    it('유효하지 않은 ID 형식이면 400 반환', async () => {
      const res = await request(server).get('/articles/notanumber');
      expect(res.status).toBe(400);
    });
  });
});

// ──────────────────────────────────────────────────────────────────
// 인증 필요 API
// ──────────────────────────────────────────────────────────────────
describe('[Articles API - 인증] 인증 필요 테스트', () => {
  // ── 게시글 생성 ──
  describe('POST /articles - 게시글 생성', () => {
    it('인증 없이 요청 시 401 반환', async () => {
      const res = await request(server).post('/articles').send({
        title: '무인증 게시글',
        content: '내용',
        image: null,
      });
      expect(res.status).toBe(401);
    });

    it('인증 후 게시글 생성 시 201 반환', async () => {
      const res = await request(server)
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '테스트 게시글',
          content: '테스트 게시글 내용입니다.',
          image: null,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('테스트 게시글');
      expect(res.body.userId).toBe(testUserId);

      createdArticleId = res.body.id;
    });

    it('제목 누락 시 400 반환', async () => {
      const res = await request(server)
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '내용만있음', image: null });

      expect(res.status).toBe(400);
    });

    it('제목이 공백 문자열이면 400 반환', async () => {
      const res = await request(server)
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '   ', content: '내용', image: null });

      expect(res.status).toBe(400);
    });
  });

  // ── 단건 조회 (생성 후) ──
  describe('GET /articles/:id - 생성된 게시글 조회', () => {
    it('생성된 게시글 ID로 조회 시 200 반환', async () => {
      const res = await request(server).get(`/articles/${createdArticleId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdArticleId);
      expect(res.body.title).toBe('테스트 게시글');
    });
  });

  // ── 게시글 수정 ──
  describe('PATCH /articles/:id - 게시글 수정', () => {
    it('인증 없이 수정 시 401 반환', async () => {
      const res = await request(server)
        .patch(`/articles/${createdArticleId}`)
        .send({ title: '수정 시도' });

      expect(res.status).toBe(401);
    });

    it('본인 게시글 수정 시 200 반환', async () => {
      const res = await request(server)
        .patch(`/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '수정된 제목', content: '수정된 내용' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('수정된 제목');
    });

    it('다른 유저 토큰으로 수정 시 401 또는 403 반환', async () => {
      const otherToken = jwt.sign(
        { id: 99999 },
        process.env.JWT_SECRET || 'access_secret',
        { expiresIn: '1h' }
      );

      const res = await request(server)
        .patch(`/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: '해킹 시도' });

      expect([401, 403]).toContain(res.status);
    });

    it('존재하지 않는 게시글 수정 시 404 반환', async () => {
      const res = await request(server)
        .patch('/articles/999999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '없는게시글' });

      expect(res.status).toBe(404);
    });
  });

  // ── 댓글 ──
  describe('POST /articles/:id/comments - 댓글 생성', () => {
    it('인증 없이 댓글 생성 시 401 반환', async () => {
      const res = await request(server)
        .post(`/articles/${createdArticleId}/comments`)
        .send({ content: '댓글' });

      expect(res.status).toBe(401);
    });

    it('인증 후 댓글 생성 시 201 반환', async () => {
      const res = await request(server)
        .post(`/articles/${createdArticleId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '게시글 댓글입니다.' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('게시글 댓글입니다.');
      expect(res.body.articleId).toBe(createdArticleId);
    });

    it('내용 누락 시 400 반환', async () => {
      const res = await request(server)
        .post(`/articles/${createdArticleId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /articles/:id/comments - 댓글 목록 조회', () => {
    it('인증 후 댓글 목록 조회 시 list, nextCursor 포함', async () => {
      const res = await request(server)
        .get(`/articles/${createdArticleId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(res.body).toHaveProperty('nextCursor');
    });
  });

  // ── 게시글 삭제 ──
  describe('DELETE /articles/:id - 게시글 삭제', () => {
    it('인증 없이 삭제 시 401 반환', async () => {
      const res = await request(server).delete(`/articles/${createdArticleId}`);
      expect(res.status).toBe(401);
    });

    it('본인 게시글 삭제 시 204 반환', async () => {
      const res = await request(server)
        .delete(`/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });

    it('이미 삭제된 게시글 삭제 시 404 반환', async () => {
      const res = await request(server)
        .delete(`/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});