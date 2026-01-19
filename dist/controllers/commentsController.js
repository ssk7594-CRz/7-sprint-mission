"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComment = updateComment;
exports.deleteComment = deleteComment;
const superstruct_1 = require("superstruct");
const prismaClient_1 = require("../lib/prismaClient");
const commentsStruct_1 = require("../structs/commentsStruct");
const NotFoundError_1 = __importDefault(require("../lib/errors/NotFoundError"));
const commonStructs_1 = require("../structs/commonStructs");
const UnauthorizedError_1 = __importDefault(require("../lib/errors/UnauthorizedError"));
const ForbiddenError_1 = __importDefault(require("../lib/errors/ForbiddenError"));
async function updateComment(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const { content } = (0, superstruct_1.create)(req.body, commentsStruct_1.UpdateCommentBodyStruct);
    const existingComment = await prismaClient_1.prismaClient.comment.findUnique({ where: { id } });
    if (!existingComment) {
        throw new NotFoundError_1.default('comment', id);
    }
    if (existingComment.userId !== req.user.id) {
        throw new ForbiddenError_1.default('Should be the owner of the comment');
    }
    const updatedComment = await prismaClient_1.prismaClient.comment.update({
        where: { id },
        data: { content },
    });
    return res.send(updatedComment);
}
async function deleteComment(req, res) {
    if (!req.user) {
        throw new UnauthorizedError_1.default('Unauthorized');
    }
    const { id } = (0, superstruct_1.create)(req.params, commonStructs_1.IdParamsStruct);
    const existingComment = await prismaClient_1.prismaClient.comment.findUnique({ where: { id } });
    if (!existingComment) {
        throw new NotFoundError_1.default('comment', id);
    }
    if (existingComment.userId !== req.user.id) {
        throw new ForbiddenError_1.default('Should be the owner of the comment');
    }
    await prismaClient_1.prismaClient.comment.delete({ where: { id } });
    return res.status(204).send();
}
