/**
 * 상품 API 비즈니스 로직 유닛 테스트
 * jest.mock + jest.spyOn 활용, DB 연결 불필요
 */

import { Request, Response, NextFunction } from 'express';

// ── Prisma 전체 Mock ─────────────────────────────────────────────
jest.mock('../src/lib/prismaClient', () => ({
  prismaClient: {
    product: {
      create:     jest.fn(),
      findUnique: jest.fn(),
      findMany:   jest.fn(),
      update:     jest.fn(),
      delete:     jest.fn(),
      count:      jest.fn(),
    },
    productLike: {
      findMany: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

// ── socket Mock ──────────────────────────────────────────────────
jest.mock('../src/socket/socket', () => ({
  emitNotification: jest.fn(),
}));

import { prismaClient as prismaMock } from '../src/lib/prismaClient';
import * as socketModule from '../src/socket/socket';
import {
  createProduct,
  getProduct,
  getProductList,
  updateProduct,
  deleteProduct,
} from '../src/controllers/productsController';

// ── 타입 편의상 any 캐스팅 ───────────────────────────────────────
const db = prismaMock as any;

// ── Mock req / res / next 팩토리 ─────────────────────────────────
const makeMockReq = (overrides: Partial<Request> = {}): Request =>
  ({
    body: {},
    params: {},
    query: {},
    user: {
      id: 1,
      email: 'test@test.com',
      nickname: 'Tester',
      password: 'hashed',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshToken: null,
    },
    app: { get: jest.fn().mockReturnValue(undefined) },
    ...overrides,
  } as unknown as Request);

const makeMockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as unknown as NextFunction;

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════
describe('[Unit] createProduct', () => {
// ══════════════════════════════════════════════════════════════════

  it('정상 데이터 → prisma.product.create 호출 + 201 반환', async () => {
    const fakeProduct = {
      id: 1, name: '테스트 상품', description: '설명',
      price: 10000, tags: ['tag1'], images: ['img.jpg'],
      userId: 1, createdAt: new Date(), updatedAt: new Date(),
    };
    db.product.create.mockResolvedValue(fakeProduct);

    const req = makeMockReq({
      body: { name: '테스트 상품', description: '설명', price: 10000, tags: ['tag1'], images: ['img.jpg'] },
    });
    const res = makeMockRes();

    await (createProduct as any)(req, res, mockNext);

    expect(db.product.create).toHaveBeenCalledTimes(1);
    expect(db.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: '테스트 상품', price: 10000, userId: 1 }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(fakeProduct);
  });

  it('DB 오류 발생 → next(error) 호출', async () => {
    const dbError = new Error('DB connection failed');
    db.product.create.mockRejectedValue(dbError);

    const req = makeMockReq({
      body: { name: '상품', description: '설명', price: 100, tags: [], images: [] },
    });
    const res = makeMockRes();

    await (createProduct as any)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════
describe('[Unit] getProduct', () => {
// ══════════════════════════════════════════════════════════════════

  it('존재하는 ID → prisma.findUnique 호출 + res.send', async () => {
    const fakeProduct = {
      id: 1, name: '상품', description: '설명', price: 5000,
      tags: [], images: [], userId: 1, createdAt: new Date(), updatedAt: new Date(),
    };
    db.product.findUnique.mockResolvedValue(fakeProduct);

    const req = makeMockReq({ params: { id: '1' } });
    const res = makeMockRes();

    await (getProduct as any)(req, res, mockNext);

    expect(db.product.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.send).toHaveBeenCalledWith(fakeProduct);
  });

  it('존재하지 않는 ID → NotFoundError → next 호출', async () => {
    db.product.findUnique.mockResolvedValue(null);

    const req = makeMockReq({ params: { id: '999' } });
    const res = makeMockRes();

    await (getProduct as any)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as jest.Mock).mock.calls[0][0];
    expect(err.name).toBe('NotFoundError');
  });
});

// ══════════════════════════════════════════════════════════════════
describe('[Unit] getProductList', () => {
// ══════════════════════════════════════════════════════════════════

  it('기본 쿼리 → product.count + product.findMany 호출 + { list, totalCount } 반환', async () => {
    const fakeList = [
      { id: 1, name: '상품1', description: '설명1', price: 1000, tags: [], images: [], userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: '상품2', description: '설명2', price: 2000, tags: [], images: [], userId: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    db.product.count.mockResolvedValue(2);
    db.product.findMany.mockResolvedValue(fakeList);

    const req = makeMockReq({ query: { page: '1', pageSize: '10' } });
    const res = makeMockRes();

    await (getProductList as any)(req, res, mockNext);

    expect(db.product.count).toHaveBeenCalledTimes(1);
    expect(db.product.findMany).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ list: fakeList, totalCount: 2 });
  });

  it('keyword 있으면 findMany에 OR 필터 포함', async () => {
    db.product.count.mockResolvedValue(0);
    db.product.findMany.mockResolvedValue([]);

    const req = makeMockReq({ query: { page: '1', pageSize: '10', keyword: '검색어' } });
    const res = makeMockRes();

    await (getProductList as any)(req, res, mockNext);

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name:        { contains: '검색어' } },
            { description: { contains: '검색어' } },
          ],
        },
      })
    );
  });

  it('orderBy=recent → findMany에 { id: desc } 정렬', async () => {
    db.product.count.mockResolvedValue(0);
    db.product.findMany.mockResolvedValue([]);

    const req = makeMockReq({ query: { page: '1', pageSize: '10', orderBy: 'recent' } });
    const res = makeMockRes();

    await (getProductList as any)(req, res, mockNext);

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { id: 'desc' } })
    );
  });

  it('page=2, pageSize=5 → skip=5 적용', async () => {
    db.product.count.mockResolvedValue(10);
    db.product.findMany.mockResolvedValue([]);

    const req = makeMockReq({ query: { page: '2', pageSize: '5' } });
    const res = makeMockRes();

    await (getProductList as any)(req, res, mockNext);

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
  });
});

// ══════════════════════════════════════════════════════════════════
describe('[Unit] updateProduct', () => {
// ══════════════════════════════════════════════════════════════════

  const existingProduct = {
    id: 1, name: '기존 상품', description: '설명', price: 5000,
    tags: [], images: [], userId: 1, createdAt: new Date(), updatedAt: new Date(),
  };

  it('가격 변경 시 → productLike 조회 + notification.createMany + emitNotification Spy 호출', async () => {
    db.product.findUnique.mockResolvedValue(existingProduct);
    const updatedProduct = { ...existingProduct, name: '수정 상품', price: 9999 };
    db.product.update.mockResolvedValue(updatedProduct);
    db.productLike.findMany.mockResolvedValue([{ userId: 2 }, { userId: 3 }]);
    db.notification.createMany.mockResolvedValue({ count: 2 });

    // Spy: emitNotification이 몇 번 호출되는지 검증
    const emitSpy = jest.spyOn(socketModule, 'emitNotification');

    const req = makeMockReq({
      params: { id: '1' },
      body: { name: '수정 상품', price: 9999 },
    });
    const res = makeMockRes();

    await (updateProduct as any)(req, res, mockNext);

    // 알림 대상 조회 검증
    expect(db.productLike.findMany).toHaveBeenCalledWith({
      where: { productId: 1 },
      select: { userId: true },
    });

    // 알림 DB 저장 검증
    expect(db.notification.createMany).toHaveBeenCalledTimes(1);
    expect(db.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ type: 'PRICE_CHANGE', userId: 2 }),
          expect.objectContaining({ type: 'PRICE_CHANGE', userId: 3 }),
        ]),
      })
    );

    // 소켓 알림 Spy 검증 (유저 2명 → 2회 호출)
    expect(emitSpy).toHaveBeenCalledTimes(2);

    expect(res.send).toHaveBeenCalledWith(updatedProduct);
  });

  it('가격 변경 없으면 → 알림/소켓 호출 없음', async () => {
    db.product.findUnique.mockResolvedValue(existingProduct);
    db.product.update.mockResolvedValue({ ...existingProduct, name: '이름만 변경' });

    const emitSpy = jest.spyOn(socketModule, 'emitNotification');

    const req = makeMockReq({
      params: { id: '1' },
      body: { name: '이름만 변경', price: 5000 }, // 가격 동일
    });
    const res = makeMockRes();

    await (updateProduct as any)(req, res, mockNext);

    expect(db.productLike.findMany).not.toHaveBeenCalled();
    expect(db.notification.createMany).not.toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('다른 유저 소유 상품 수정 시도 → 403 + product.update 미호출', async () => {
    db.product.findUnique.mockResolvedValue({ ...existingProduct, userId: 99 });

    const req = makeMockReq({ params: { id: '1' }, body: { name: '해킹 시도' } });
    const res = makeMockRes();

    await (updateProduct as any)(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(db.product.update).not.toHaveBeenCalled();
  });

  it('존재하지 않는 상품 수정 → NotFoundError → next 호출', async () => {
    db.product.findUnique.mockResolvedValue(null);

    const req = makeMockReq({ params: { id: '999' }, body: { name: '없음' } });
    const res = makeMockRes();

    await (updateProduct as any)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as jest.Mock).mock.calls[0][0];
    expect(err.name).toBe('NotFoundError');
  });
});

// ══════════════════════════════════════════════════════════════════
describe('[Unit] deleteProduct', () => {
// ══════════════════════════════════════════════════════════════════

  it('본인 상품 삭제 → product.delete 호출 + 204 반환', async () => {
    db.product.findUnique.mockResolvedValue({
      id: 1, name: '삭제할 상품', description: '설명', price: 1000,
      tags: [], images: [], userId: 1, createdAt: new Date(), updatedAt: new Date(),
    });
    db.product.delete.mockResolvedValue({});

    const req = makeMockReq({ params: { id: '1' } });
    const res = makeMockRes();

    await (deleteProduct as any)(req, res, mockNext);

    expect(db.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('다른 유저 소유 상품 삭제 시도 → 403 + product.delete 미호출', async () => {
    db.product.findUnique.mockResolvedValue({
      id: 1, name: '남의 상품', description: '설명', price: 1000,
      tags: [], images: [], userId: 99, createdAt: new Date(), updatedAt: new Date(),
    });

    const req = makeMockReq({ params: { id: '1' } });
    const res = makeMockRes();

    await (deleteProduct as any)(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(db.product.delete).not.toHaveBeenCalled();
  });

  it('존재하지 않는 상품 삭제 → NotFoundError → next 호출', async () => {
    db.product.findUnique.mockResolvedValue(null);

    const req = makeMockReq({ params: { id: '999' } });
    const res = makeMockRes();

    await (deleteProduct as any)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const err = (mockNext as jest.Mock).mock.calls[0][0];
    expect(err.name).toBe('NotFoundError');
  });
});