import { Article, UnregisteredArticle } from "./article.js";
import { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import { ArticleComment } from "./comment.js";
const articleRouter = new Router();

const articleCommentRouter = new Router({ mergeParams: true });

// ### 댓글
// - 댓글 등록 API를 만들어 주세요.
// /articles/:articleId/comments/ POST
//     - `content`를 입력하여 댓글을 등록합니다.
//     - 중고마켓, 자유게시판 댓글 등록 API를 따로 만들어 주세요.
articleCommentRouter.post("/", async (req, res) => {
  const { content } = req.body;

  const created = await prisma.article_comment.create({
    data: {
      content,
      article_id: req.params.articleId,
    },
  });
  const articleComment = ArticleComment.fromEntity(created);
  res.json(articleComment);
});

// - 댓글 수정 API를 만들어 주세요.
// /articles/:articleId/comments/:commentId PATCH
//     - `PATCH` 메서드를 사용해 주세요.
articleCommentRouter.patch("/:commentId", async (req, res) => {
  const { content } = req.body;

  const updated = await prisma.article_comment.update({
    where: {
      id: req.params.commentId,
    },
    data: {
      content,
      article_id: req.params.articleId,
    },
  });
  const articleComment = ArticleComment.fromEntity(updated);
  res.json(articleComment);
});

// - 댓글 목록 조회 API를 만들어 주세요.
// /articles/:articleId/comments/ GET
//     - `id`, `content`, `createdAt` 를 조회합니다.
//     - cursor 방식의 페이지네이션 기능을 포함해 주세요.
articleCommentRouter.get("/", async (req, res) => {
  const entities = await prisma.article_comment.findMany({
    where: {
      article_id: req.params.articleId,
    },
  });
  const articleComments = entities.map(ArticleComment.fromEntity);
  res.json(articleComments);
});

articleRouter.use("/:articleId/comments", articleCommentRouter);

articleRouter.get("/", async (req, res, next) => {
  try {
    const findArticlesOption = getFindArticlesOption(req.query);
    const entities = await prisma.article.findMany(findArticlesOption);
    const knonwArticles = entities.map(Article.fromEntity);
    res.json(knonwArticles);
  } catch (e) {
    next(e);
  }
});

articleRouter.post("/", async (req, res, next) => {
  try {
    const unregistered = UnregisteredArticle.fromInfo(req.body);
    const newEntity = await prisma.article.create({ data: unregistered });
    res.json(Article.fromEntity(newEntity));
  } catch (e) {
    next(e);
  }
});

function getFindArticlesOption({ keyword, page = "1", limit = "10" }) {
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

// - 댓글 삭제 API를 만들어 주세요.
// /articles/:articleId/comments/:commentId DELETE
articleCommentRouter.delete("/:commentId", (req, res) =>
  prisma.article_comment
    .delete({
      where: {
        id: req.params.commentId,
      },
    })
    .then(ArticleComment.fromEntity)
    .then((comment) => res.json(comment))
);

// 특정 게시글 조회 (404 예시)
articleRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const articleId = parseInt(id);

    // ID 유효성 검사 (400 에러)
    if (isNaN(articleId)) {
      throw new BadRequestError("유효하지 않은 게시글 ID입니다.");
    }

    const entity = await prisma.article.findUnique({
      where: { id: articleId },
    });

    // 게시글이 없으면 404 에러
    if (!entity) {
      throw new NotFoundError("게시글을 찾을 수 없습니다.");
    }

    res.json(Article.fromEntity(entity));
  } catch (e) {
    next(e);
  }
});

export default articleRouter;
