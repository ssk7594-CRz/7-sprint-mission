import { Product, UnregisteredProduct } from "./products.js";
import { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import { ProductComment } from "./comment.js";
const ProductRouter = new Router();

const ProductCommentRouter = new Router({ mergeParams: true });
productRouter.use("/:productId/comments", productCommentRouter);

// ### 댓글
// - 댓글 등록 API를 만들어 주세요.
// /products/:productId/comments/ POST
//     - `content`를 입력하여 댓글을 등록합니다.
//     - 중고마켓, 자유게시판 댓글 등록 API를 따로 만들어 주세요.
productCommentRouter.post("/", async (req, res) => {
  const { content } = req.body;

  const created = await prisma.product_comment.create({
    data: {
      content,
      product_id: req.params.productId,
    },
  });
  const productComment = ProductComment.fromEntity(created);
  res.json(productComment);
});

// - 댓글 수정 API를 만들어 주세요.
// /products/:productId/comments/:commentId PATCH
//     - `PATCH` 메서드를 사용해 주세요.
productCommentRouter.patch("/:commentId", async (req, res) => {
  const { content } = req.body;

  const updated = await prisma.product_comment.update({
    where: {
      id: req.params.commentId,
    },
    data: {
      content,
      product_id: req.params.productId,
    },
  });
  const productComment = ProductComment.fromEntity(updated);
  res.json(productComment);
});

// - 댓글 삭제 API를 만들어 주세요.
// /products/:productId/comments/:commentId DELETE
productCommentRouter.delete("/:commentId", (req, res) =>
  prisma.product_comment
    .delete({
      where: {
        id: req.params.commentId,
      },
    })
    .then(ProductComment.fromEntity)
    .then((comment) => res.json(comment))
);

// - 댓글 목록 조회 API를 만들어 주세요.
// /products/:productId/comments/ GET
//     - `id`, `content`, `createdAt` 를 조회합니다.
//     - cursor 방식의 페이지네이션 기능을 포함해 주세요.
productCommentRouter.get("/", async (req, res) => {
  const entities = await prisma.product_comment.findMany({
    where: {
      product_id: req.params.productId,
    },
  });
  const productComments = entities.map(ProductComment.fromEntity);
  res.json(productComments);
});

productRouter.get("/", async (req, res, next) => {
  try {
    const findProductsOption = getFindProductsOption(req.query);
    const entities = await prisma.product.findMany(findProductsOption);
    const knonwProducts = entities.map(Product.fromEntity);
    res.json(knonwProducts);
  } catch (e) {
    next(e);
  }
});

// 특정 게시글 조회 (404 예시)
productRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    // ID 유효성 검사 (400 에러)
    if (isNaN(productId)) {
      throw new BadRequestError("유효하지 않은 게시글 ID입니다.");
    }

    const entity = await prisma.product.findUnique({
      where: { id: productId },
    });

    // 게시글이 없으면 404 에러
    if (!entity) {
      throw new NotFoundError("게시글을 찾을 수 없습니다.");
    }

    res.json(Product.fromEntity(entity));
  } catch (e) {
    next(e);
  }
});

productRouter.post("/", async (req, res, next) => {
  try {
    const unregistered = UnregisteredProduct.fromInfo(req.body);
    const newEntity = await prisma.product.create({ data: unregistered });
    res.json(Product.fromEntity(newEntity));
  } catch (e) {
    next(e);
  }
});

function getFindProductsOption({ keyword, page = "1", limit = "10" }) {
  //최신순(recent)으로 정렬할 수 있습니다.
  const skip = (parseInt(page) - 1) * limit;
  const take = parseInt(limit);
  if (isNaN(skip) || isNaN(take)) {
    throw new BadRequestError("유효하지 않은 게시글 ID입니다.");
  }

  const option = {
    skip,
    take,
    orderBy: [{ created_at: "desc" }, { id: "asc" }],
  };

  //title, content에 포함된 단어로 검색할 수 있습니다.
  if (keyword) {
    option.where = {
      OR: [
        {
          title: {
            contains: keyword,
          },
        },
        {
          content: {
            contains: keyword,
          },
        },
      ],
    };
  }
  return option;
}

export default productRouter;
