"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const withAsync_1 = require("../lib/withAsync");
const authRouter = express_1.default.Router();
authRouter.post('/register', (0, withAsync_1.withAsync)(authController_1.register));
authRouter.post('/login', (0, withAsync_1.withAsync)(authController_1.login));
authRouter.post('/logout', (0, withAsync_1.withAsync)(authController_1.logout));
authRouter.post('/refresh', (0, withAsync_1.withAsync)(authController_1.refreshToken));
exports.default = authRouter;
