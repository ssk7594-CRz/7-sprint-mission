"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.getProduct = getProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.getProductList = getProductList;
exports.createComment = createComment;
exports.getCommentList = getCommentList;
exports.createFavorite = createFavorite;
exports.deleteFavorite = deleteFavorite;
const superstruct_1 = require("superstruct");
const prismaClient_1 = require("../lib/prismaClient");
const NotFoundError_1 = __importDefault(require("../lib/errors/NotFoundError"));
const commonStructs_1 = require("../structs/commonStructs");
const productsStruct_1 = require("../structs/productsStruct");
const commentsStruct_1 = require("../structs/commentsStruct");
const UnauthorizedError_1 = __importDefault(require("../lib/errors/UnauthorizedError"));
const ForbiddenError_1 = __importDefault(require("../lib/errors/ForbiddenError"));
const BadRequestError_1 = __importDefault(require("../lib/errors/BadRequestError"));
async function createProduct(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const data = (0, superstruct_1.create)(req.body, productsStruct_1.CreateProductBodyStruct);
    const createdProduct = await prismaClient_1.prismaClient.product.create({
        data: {
            ...data,
            userId: req.user.id,
        },
    });
    res.status(201).send(createdProduct);
}
async function getProduct(req, res) {
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const product = await prismaClient_1.prismaClient.product.findUnique({
        where: { id },
        include: { favorites: true },
    });
    if (!product) {
        throw new NotFoundError_1.default('product', id);
    }
    const productWithFavorites = {
        ...product,
        favorites: undefined,
        favoriteCount: product.favorites.length,
        isFavorited: req.user
            ? product.favorites.some((favorite) => favorite.userId === req.user?.id)
            : undefined,
    };
    return res.send(productWithFavorites);
}
async function updateProduct(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const { name, description, price, tags, images } = (0, superstruct_1.create)(req.body, productsStruct_1.UpdateProductBodyStruct);
    const existingProduct = await prismaClient_1.prismaClient.product.findUnique({ where: { id } });
    if (!existingProduct) {
        throw new NotFoundError_1.default('product', id);
    }
    if (existingProduct.userId !== req.user.id) {
        throw new ForbiddenError_1.default('Should be the owner of the product');
    }
    const updatedProduct = await prismaClient_1.prismaClient.product.update({
        where: { id },
        data: { name, description, price, tags, images },
    });
    return res.send(updatedProduct);
}
async function deleteProduct(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const existingProduct = await prismaClient_1.prismaClient.product.findUnique({ where: { id } });
    if (!existingProduct) {
        throw new NotFoundError_1.default('product', id);
    }
    if (existingProduct.userId !== req.user.id) {
        throw new ForbiddenError_1.default('Should be the owner of the product');
    }
    await prismaClient_1.prismaClient.product.delete({ where: { id } });
    return res.status(204).send();
}
async function getProductList(req, res) {
    const { page, pageSize, orderBy, keyword } = (0, superstruct_1.create)(req.query, productsStruct_1.GetProductListParamsStruct);
    const where = keyword
        ? {
            OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }],
        }
        : undefined;
    const totalCount = await prismaClient_1.prismaClient.product.count({ where });
    const products = await prismaClient_1.prismaClient.product.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
        where,
        include: {
            favorites: true,
        },
    });
    const productsWithFavorites = products.map((product) => ({
        ...product,
        favorites: undefined,
        favoriteCount: product.favorites.length,
        isFavorited: req.user
            ? product.favorites.some((favorite) => favorite.userId === req.user?.id)
            : undefined,
    }));
    return res.send({
        list: productsWithFavorites,
        totalCount,
    });
}
async function createComment(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id: productId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const { content } = (0, superstruct_1.create)(req.body, commentsStruct_1.CreateCommentBodyStruct);
    const existingProduct = await prismaClient_1.prismaClient.product.findUnique({ where: { id: productId } });
    if (!existingProduct) {
        throw new NotFoundError_1.default('product', productId);
    }
    const createdComment = await prismaClient_1.prismaClient.comment.create({
        data: { productId, content, userId: req.user.id },
    });
    return res.status(201).send(createdComment);
}
async function getCommentList(req, res) {
    const { id: productId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const { cursor, limit } = (0, superstruct_1.create)(req.query, commentsStruct_1.GetCommentListParamsStruct);
    const existingProduct = await prismaClient_1.prismaClient.product.findUnique({ where: { id: productId } });
    if (!existingProduct) {
        throw new NotFoundError_1.default('product', productId);
    }
    const commentsWithCursorComment = await prismaClient_1.prismaClient.comment.findMany({
        cursor: cursor ? { id: cursor } : undefined,
        take: limit + 1,
        where: { productId },
    });
    const comments = commentsWithCursorComment.slice(0, limit);
    const cursorComment = commentsWithCursorComment[comments.length - 1];
    const nextCursor = cursorComment ? cursorComment.id : null;
    return res.send({
        list: comments,
        nextCursor,
    });
}
async function createFavorite(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id: productId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const existingProduct = await prismaClient_1.prismaClient.product.findUnique({ where: { id: productId } });
    if (!existingProduct) {
        throw new NotFoundError_1.default('product', productId);
    }
    const existingFavorite = await prismaClient_1.prismaClient.favorite.findFirst({
        where: { productId, userId: req.user.id },
    });
    if (existingFavorite) {
        throw new BadRequestError_1.default('Already favorited');
    }
    await prismaClient_1.prismaClient.favorite.create({ data: { productId, userId: req.user.id } });
    return res.status(201).send();
}
async function deleteFavorite(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id: productId } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const existingFavorite = await prismaClient_1.prismaClient.favorite.findFirst({
        where: { productId, userId: req.user.id },
    });
    if (!existingFavorite) {
        throw new BadRequestError_1.default('Not favorited');
    }
    await prismaClient_1.prismaClient.favorite.delete({ where: { id: existingFavorite.id } });
    return res.status(204).send();
}
