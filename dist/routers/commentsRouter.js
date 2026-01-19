"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const withAsync_1 = require("../lib/withAsync");
const commentsController_1 = require("../controllers/commentsController");
const authenticate_1 = __importDefault(require("../middlewares/authenticate"));
const commentsRouter = express_1.default.Router();
commentsRouter.patch('/:id', (0, authenticate_1.default)(), (0, withAsync_1.withAsync)(commentsController_1.updateComment));
commentsRouter.delete('/:id', (0, authenticate_1.default)(), (0, withAsync_1.withAsync)(commentsController_1.deleteComment));
exports.default = commentsRouter;
