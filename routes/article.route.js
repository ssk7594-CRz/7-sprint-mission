import { Article, UnregisteredArticle } from "./articles.js";
import { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import articleCommentRouter from "./article-comment.route.js";

const articleRouter = new Router();

articleRouter.use("/:articleId/comments", articleCommentRouter);

articleRouter.get("/", validateGetArticles, async (req, res, next) => {
  try {
    const findArticlesOption = getFindArticlesOption(req.query);
    const entities = await prisma.article.findMany(findArticlesOption);
    const knonwArticles = entities.map(Article.fromEntity);
    res.json(knonwArticles);
  } catch (e) {
    next(e);
  }
});

// 특정 게시글 조회 (404 예시)
articleRouter.route("/:id").get(validateGetArticle, async (req, res, next) => {
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

articleRouter.post("/", validatePostArticle, async (req, res, next) => {
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

export default articleRouter;

function validateDeleteArticle(req, res, next) {
  next();
}
function validatePatchArticle(req, res, next) {
  next();
}
function validateGetArticles(req, res, next) {
  next();
}
function validateGetArticle(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) throw new BadRequestError("id가 왜 이럼??");
  next();
}
function validatePostArticle(req, res, next) {
  next();
}
