"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.updateMyPassword = updateMyPassword;
exports.getMyProductList = getMyProductList;
exports.getMyFavoriteList = getMyFavoriteList;
const superstruct_1 = require("superstruct");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = require("../lib/prismaClient");
const usersStructs_1 = require("../structs/usersStructs");
const NotFoundError_1 = __importDefault(require("../lib/errors/NotFoundError"));
const UnauthorizedError_1 = __importDefault(require("../lib/errors/UnauthorizedError"));
async function getMe(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const user = await prismaClient_1.prismaClient.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        throw new NotFoundError_1.default('user', req.user.id);
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.send(userWithoutPassword);
}
async function updateMe(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const data = (0, superstruct_1.create)(req.body, usersStructs_1.UpdateMeBodyStruct);
    const updatedUser = await prismaClient_1.prismaClient.user.update({
        where: { id: req.user.id },
        data,
    });
    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).send(userWithoutPassword);
}
async function updateMyPassword(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { password, newPassword } = (0, superstruct_1.create)(req.body, usersStructs_1.UpdatePasswordBodyStruct);
    const user = await prismaClient_1.prismaClient.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        throw new NotFoundError_1.default('user', req.user.id);
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedError_1.default('Invalid credentials');
    }
    const salt = await bcrypt_1.default.genSalt(10);
    const hashedPassword = await bcrypt_1.default.hash(newPassword, salt);
    await prismaClient_1.prismaClient.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
    });
    return res.status(200).send();
}
async function getMyProductList(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { page, pageSize, orderBy, keyword } = (0, superstruct_1.create)(req.query, usersStructs_1.GetMyProductListParamsStruct);
    const where = keyword
        ? {
            OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }],
        }
        : {};
    const totalCount = await prismaClient_1.prismaClient.product.count({
        where: {
            ...where,
            userId: req.user.id,
        },
    });
    const products = await prismaClient_1.prismaClient.product.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
        where: {
            ...where,
            userId: req.user.id,
        },
        include: {
            favorites: true,
        },
    });
    const productsWithFavorites = products.map((product) => ({
        ...product,
        favorites: undefined,
        favoriteCount: product.favorites.length,
        isFavorited: product.favorites.some((favorite) => favorite.userId === req.user?.id),
    }));
    return res.send({
        list: productsWithFavorites,
        totalCount,
    });
}
async function getMyFavoriteList(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { page, pageSize, orderBy, keyword } = (0, superstruct_1.create)(req.query, usersStructs_1.GetMyFavoriteListParamsStruct);
    const where = keyword
        ? {
            OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }],
        }
        : {};
    const totalCount = await prismaClient_1.prismaClient.product.count({
        where: {
            ...where,
            favorites: {
                some: {
                    userId: req.user.id,
                },
            },
        },
    });
    const products = await prismaClient_1.prismaClient.product.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy === 'recent' ? { id: 'desc' } : { id: 'asc' },
        where: {
            ...where,
            favorites: {
                some: {
                    userId: req.user.id,
                },
            },
        },
        include: {
            favorites: true,
        },
    });
    const productsWithFavorites = products.map((product) => ({
        ...product,
        favorites: undefined,
        favoriteCount: product.favorites.length,
        isFavorited: true,
    }));
    return res.send({
        list: productsWithFavorites,
        totalCount,
    });
}
