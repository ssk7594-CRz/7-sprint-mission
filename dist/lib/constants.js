"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATIC_PATH = exports.PUBLIC_PATH = exports.PORT = exports.NODE_ENV = exports.JWT_REFRESH_TOKEN_SECRET = exports.JWT_ACCESS_TOKEN_SECRET = exports.DATABASE_URL = exports.REFRESH_TOKEN_COOKIE_NAME = exports.ACCESS_TOKEN_COOKIE_NAME = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ACCESS_TOKEN_COOKIE_NAME = 'access-token';
exports.REFRESH_TOKEN_COOKIE_NAME = 'refresh-token';
exports.DATABASE_URL = process.env.DATABASE_URL;
exports.JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
exports.JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.PORT = process.env.PORT || 3000;
exports.PUBLIC_PATH = './public';
exports.STATIC_PATH = '/public';
