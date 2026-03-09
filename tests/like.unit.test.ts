/**
 * likeController 유닛 테스트
 * Mock을 활용해 DB 없이 좋아요 토글 로직 검증
 */

import { Request, Response, NextFunction } from 'express';

// ── Prisma Mock ──────────────────────────────────────────────────
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    productLike: {
      findUnique: jest.fn(),
      create:     jest.fn(),
      delete:     jest.fn(),
    },
    articleLike: {
      findUnique: jest.fn(),
      create:     jest.fn(),
      delete:     jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

import { PrismaClient } from '@prisma/client';
import {
  toggleProductLike,
  toggleArticleLike,
  getProductDetail,
} from '../src/controllers/likeController';

const prisma = new PrismaClient() as any;

// ── Mock req / res / next ────────────────────────────────────────
const makeMockReq = (overrides: Partial<Request> = {}): Request =>
  ({
    params: {},
    body: {},
    query: {},
    user: { id: 1, email: 'test@test.com', nickname: 'Tester', password: 'hashed', image: null, createdAt: new Date(), updatedAt: new Date(), refreshToken: null },
    ...overrides,
  } as unknown as Request);

const makeMockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as unknown as NextFunction;

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════
describe('[Unit] toggleProductLike', () => {
// ══════════════════════════════════════════════════════════════════

  it('좋아요 없는 상태 → productLike.create 호출 + { isLiked: true }', async () => {
    prisma.productLike.findUnique.mockResolvedValue(null); // 좋아요 없음
    prisma.productLike.create.mockResolvedValue({ id: 1, userId: 1, productId: 10 });

    const req = makeMockReq({ params: { id: '10' } });
    const res = makeMockRes();

    await (toggleProductLike as any)(req, res, mockNext);

    expect(prisma.productLike.findUnique).toHaveBeenCalledWith({
      where: { userId_productId: { userId: 1, productId: 10 } },
    });
    expect(prisma.productLike.create).toHaveBeenCalledWith({
      data: { userId: 1, productId: 10 },
    });
    expect(res.json).toHaveBeenCalledWith({ isLiked: true });
  });

  it('이미 좋아요 상태 → productLike.delete 호출 + { isLiked: false }', async () => {
    const existingLike = { id: 5, userId: 1, productId: 10 };
    prisma.productLike.findUnique.mockResolvedValue(existingLike);
    prisma.productLike.delete.mockResolvedValue(existingLike);

    const req = makeMockReq({ params: { id: '10' } });
    const res = makeMockRes();

    await (toggleProductLike as any)(req, res, mockNext);

    expect(prisma.productLike.delete).toHaveBeenCalledWith({
      where: { id: 5 },
    });
    expect(prisma.productLike.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ isLiked: false });
  });

  it('DB 오류 → next(error) 호출', async () => {
    prisma.productLike.findUnique.mockRejectedValue(new Error('DB error'));

    const req = makeMockReq({ params: { id: '10' } });
    const res = makeMockRes();

    await (toggleProductLike as any)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════
describe('[Unit] toggleArticleLike', () => {
// ══════════════════════════════════════════════════════════════════

  it('좋아요 없는 상태 → articleLike.create 호출 + { isLiked: true }', async () => {
    prisma.articleLike.findUnique.mockResolvedValue(null);
    prisma.articleLike.create.mockResolvedValue({ id: 1, userId: 1, articleId: 20 });

    const req = makeMockReq({ params: { id: '20' } });
    const res = makeMockRes();

    await (toggleArticleLike as any)(req, res, mockNext);

    expect(prisma.articleLike.findUnique).toHaveBeenCalledWith({
      where: { userId_articleId: { userId: 1, articleId: 20 } },
    });
    expect(prisma.articleLike.create).toHaveBeenCalledWith({
      data: { userId: 1, articleId: 20 },
    });
    expect(res.json).toHaveBeenCalledWith({ isLiked: true });
  });

  it('이미 좋아요 상태 → articleLike.delete 호출 + { isLiked: false }', async () => {
    const existingLike = { id: 7, userId: 1, articleId: 20 };
    prisma.articleLike.findUnique.mockResolvedValue(existingLike);
    prisma.articleLike.delete.mockResolvedValue(existingLike);

    const req = makeMockReq({ params: { id: '20' } });
    const res = makeMockRes();

    await (toggleArticleLike as any)(req, res, mockNext);

    expect(prisma.articleLike.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(prisma.articleLike.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ isLiked: false });
  });
});

// ══════════════════════════════════════════════════════════════════
describe('[Unit] getProductDetail', () => {
// ══════════════════════════════════════════════════════════════════

  const fakeProduct = {
    id: 10, name: '테스트 상품', description: '설명', price: 5000,
    tags: [], images: [], userId: 99,
    _count: { productLikes: 3 },
    createdAt: new Date(), updatedAt: new Date(),
  };

  it('상품 존재 + 로그인 유저가 좋아요한 경우 → isLiked: true', async () => {
    prisma.product.findUnique.mockResolvedValue(fakeProduct);
    prisma.productLike.findUnique.mockResolvedValue({ id: 1, userId: 1, productId: 10 });

    const req = makeMockReq({ params: { id: '10' } });
    const res = makeMockRes();

    await (getProductDetail as any)(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ isLiked: true })
    );
  });

  it('상품 존재 + 좋아요 안 한 경우 → isLiked: false', async () => {
    prisma.product.findUnique.mockResolvedValue(fakeProduct);
    prisma.productLike.findUnique.mockResolvedValue(null);

    const req = makeMockReq({ params: { id: '10' } });
    const res = makeMockRes();

    await (getProductDetail as any)(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ isLiked: false })
    );
  });

  it('상품 존재하지 않으면 → 404', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const req = makeMockReq({ params: { id: '999' } });
    const res = makeMockRes();

    await (getProductDetail as any)(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('좋아요 수 포함해서 반환', async () => {
    prisma.product.findUnique.mockResolvedValue(fakeProduct);
    prisma.productLike.findUnique.mockResolvedValue(null);

    const req = makeMockReq({ params: { id: '10' } });
    const res = makeMockRes();

    await (getProductDetail as any)(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        _count: { productLikes: 3 },
      })
    );
  });
});