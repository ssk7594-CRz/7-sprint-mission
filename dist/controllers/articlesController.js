"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArticle = createArticle;
exports.getArticle = getArticle;
exports.updateArticle = updateArticle;
exports.deleteArticle = deleteArticle;
exports.getArticleList = getArticleList;
exports.createComment = createComment;
exports.getCommentList = getCommentList;
exports.createLike = createLike;
exports.deleteLike = deleteLike;
const superstruct_1 = require("superstruct");
const prismaClient_1 = require("../lib/prismaClient");
const NotFoundError_1 = __importDefault(require("../lib/errors/NotFoundError"));
const commonStructs_1 = require("../structs/commonStructs");
const articlesStructs_1 = require("../structs/articlesStructs");
const commentsStruct_1 = require("../structs/commentsStruct");
const UnauthorizedError_1 = __importDefault(require("../lib/errors/UnauthorizedError"));
const ForbiddenError_1 = __importDefault(require("../lib/errors/ForbiddenError"));
const BadRequestError_1 = __importDefault(require("../lib/errors/BadRequestError"));
async function createArticle(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const data = (0, superstruct_1.create)(req.body, articlesStructs_1.CreateArticleBodyStruct);
    const article = await prismaClient_1.prismaClient.article.create({
        data: {
            ...data,
            userId: req.user.id,
        },
    });
    return res.status(201).send(article);
}
async function getArticle(req, res) {
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const article = await prismaClient_1.prismaClient.article.findUnique({
        where: { id },
        include: {
            likes: true,
        },
    });
    if (!article) {
        throw new NotFoundError_1.default('article', id);
    }
    const articleWithLikes = {
        ...article,
        likes: undefined,
        likeCount: article.likes.length,
        isLiked: req.user ? article.likes.some((like) => like.userId === req.user?.id) : undefined,
    };
    return res.send(articleWithLikes);
}
async function updateArticle(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const data = (0, superstruct_1.create)(req.body, articlesStructs_1.UpdateArticleBodyStruct);
    const existingArticle = await prismaClient_1.prismaClient.article.findUnique({ where: { id } });
    if (!existingArticle) {
        throw new NotFoundError_1.default('article', id);
    }
    if (existingArticle.userId !== req.user.id) {
        throw new ForbiddenError_1.default('Should be the owner of the article');
    }
    const updatedArticle = await prismaClient_1.prismaClient.article.update({ where: { id }, data });
    return res.send(updatedArticle);
}
async function deleteArticle(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const existingArticle = await prismaClient_1.prismaClient.article.findUnique({ where: { id } });
    if (!existingArticle) {
        throw new NotFoundError_1.default('article', id);
    }
    if (existingArticle.userId !== req.user.id) {
        throw new ForbiddenError_1.default('Should be the owner of the article');
    }
    await prismaClient_1.prismaClient.article.delete({ where: { id } });
    return res.status(204).send();
}
async function getArticleList(req, res) {
    const { page, pageSize, orderBy, keyword } = (0, superstruct_1.create)(req.query, articlesStructs_1.GetArticleListParamsStruct);
    const where = {
        title: keyword ? { contains: keyword } : undefined,
    };
    const totalCount = await prismaClient_1.prismaClient.article.count({ where });
    const articles = await prismaClient_1.prismaClient.article.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy === 'recent' ? { createdAt: 'desc' } : { id: 'asc' },
        where,
        include: {
            likes: true,
        },
    });
    const articlesWithLikes = articles.map((article) => ({
        ...article,
        likes: undefined,
        likeCount: article.likes.length,
        isLiked: req.user ? article.likes.some((like) => like.userId === req.user?.id) : undefined,
    }));
    return res.send({
        list: articlesWithLikes,
        totalCount,
    });
}
async function createComment(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id: articleId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const { content } = (0, superstruct_1.create)(req.body, commentsStruct_1.CreateCommentBodyStruct);
    const existingArticle = await prismaClient_1.prismaClient.article.findUnique({ where: { id: articleId } });
    if (!existingArticle) {
        throw new NotFoundError_1.default('article', articleId);
    }
    const createdComment = await prismaClient_1.prismaClient.comment.create({
        data: {
            articleId,
            content,
            userId: req.user.id,
        },
    });
    return res.status(201).send(createdComment);
}
async function getCommentList(req, res) {
    const { id: articleId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const { cursor, limit } = (0, superstruct_1.create)(req.query, commentsStruct_1.GetCommentListParamsStruct);
    const article = await prismaClient_1.prismaClient.article.findUnique({ where: { id: articleId } });
    if (!article) {
        throw new NotFoundError_1.default('article', articleId);
    }
    const commentsWithCursor = await prismaClient_1.prismaClient.comment.findMany({
        cursor: cursor ? { id: cursor } : undefined,
        take: limit + 1,
        where: { articleId },
        orderBy: { createdAt: 'desc' },
    });
    const comments = commentsWithCursor.slice(0, limit);
    const cursorComment = commentsWithCursor[commentsWithCursor.length - 1];
    const nextCursor = cursorComment ? cursorComment.id : null;
    return res.send({
        list: comments,
        nextCursor,
    });
}
async function createLike(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id: articleId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const existingArticle = await prismaClient_1.prismaClient.article.findUnique({ where: { id: articleId } });
    if (!existingArticle) {
        throw new NotFoundError_1.default('article', articleId);
    }
    const existingLike = await prismaClient_1.prismaClient.like.findFirst({
        where: { articleId, userId: req.user.id },
    });
    if (existingLike) {
        throw new BadRequestError_1.default('Already liked');
    }
    await prismaClient_1.prismaClient.like.create({ data: { articleId, userId: req.user.id } });
    return res.status(201).send();
}
async function deleteLike(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id: articleId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const existingArticle = await prismaClient_1.prismaClient.article.findUnique({ where: { id: articleId } });
    if (!existingArticle) {
        throw new NotFoundError_1.default('article', articleId);
    }
    const existingLike = await prismaClient_1.prismaClient.like.findFirst({
        where: { articleId, userId: req.user.id },
    });
    if (!existingLike) {
        throw new BadRequestError_1.default('Not liked');
    }
    await prismaClient_1.prismaClient.like.delete({ where: { id: existingLike.id } });
    return res.status(204).send();
}
