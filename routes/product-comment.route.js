import { Router } from "express";
import {
  orderByToSort,
  createContinuationToken,
  parseContinuationToken,
  buildCursorWhere,
} from "../utils/cursor-pagination.js";
import { prisma } from "../prisma/prisma.js";
import { ProductComment } from "./comment.js";

const productCommentRouter = new Router({ mergeParams: true });

// ### 댓글
productCommentRouter
  .route("/")
  .post(validatePostComment, async (req, res) => {
    // - 댓글 등록 API를 만들어 주세요.
    // /products/:productId/comments/ POST
    //     - `content`를 입력하여 댓글을 등록합니다.
    //     - 중고마켓, 자유게시판 댓글 등록 API를 따로 만들어 주세요.

    const { content } = req.body;

    const created = await prisma.product_comment.create({
      data: {
        content,
        product_id: req.params.productId,
      },
    });
    const productComment = ProductComment.fromEntity(created);
    res.json(productComment);
  })
  .get(validateGetComments, async (req, res, next) => {
    // - 댓글 목록 조회 API를 만들어 주세요.
    // /products/:productId/comments/ GET
    //     - `id`, `content`, `createdAt` 를 조회합니다.
    //     - cursor 방식의 페이지네이션 기능을 포함해 주세요.

    try {
      const { cursor, limit = "10" } = req.query;
      const take = parseInt(limit);

      if (isNaN(take) || take <= 0) {
        throw new BadRequestError("유효하지 않은 limit 값입니다.");
      }

      // 정렬 기준: created_at DESC, id ASC
      const orderBy = [{ created_at: "desc" }, { id: "asc" }];
      const sort = orderByToSort(orderBy);

      // cursor token 파싱
      const cursorToken = parseContinuationToken(cursor);
      const cursorWhere = cursorToken
        ? buildCursorWhere(cursorToken.data, cursorToken.sort)
        : {};

      // 기본 where 조건 (product_id 필터)
      const baseWhere = {
        product_id: req.params.productId,
      };

      // cursor 조건과 기본 조건 병합
      const where =
        Object.keys(cursorWhere).length > 0
          ? { AND: [baseWhere, cursorWhere] }
          : baseWhere;

      // limit + 1개를 조회하여 다음 페이지 존재 여부 확인
      const entities = await prisma.product_comment.findMany({
        where,
        orderBy,
        take: take + 1,
      });

      // 다음 페이지가 있는지 확인
      const hasNext = entities.length > take;
      const items = hasNext ? entities.slice(0, take) : entities;

      // 다음 페이지를 위한 continuation token 생성
      const lastElemCursor = createContinuationToken(
        {
          id: items[items.length - 1].id,
          created_at: items[items.length - 1].created_at,
        },
        sort
      );

      const productComments = items.map(ProductComment.fromEntity);

      res.json({
        data: productComments,
        lastElemCursor,
        hasNext,
      });
    } catch (e) {
      next(e);
    }
  });

// - 댓글 수정 API를 만들어 주세요.
productCommentRouter
  .route("/:commentId")
  .patch(validatePatchComment, async (req, res) => {
    // /products/:productId/comments/:commentId PATCH
    //     - `PATCH` 메서드를 사용해 주세요.
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
  })
  .delete(validateDeleteComment, (req, res) =>
    // - 댓글 삭제 API를 만들어 주세요.
    // /products/:productId/comments/:commentId DELETE

    prisma.product_comment
      .delete({
        where: {
          id: req.params.commentId,
        },
      })
      .then(ProductComment.fromEntity)
      .then((comment) => res.json(comment))
  );

export default productCommentRouter;

function validateDeleteComment(req, res, next) {
  next();
}
function validatePatchComment(req, res, next) {
  next();
}
function validateGetComments(req, res, next) {
  next();
}
function validatePostComment(req, res, next) {
  next();
}
