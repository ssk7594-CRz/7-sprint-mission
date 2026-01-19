"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const withAsync_1 = require("../lib/withAsync");
const imagesController_1 = require("../controllers/imagesController");
const imagesRouter = express_1.default.Router();
imagesRouter.post('/upload', imagesController_1.upload.single('image'), (0, withAsync_1.withAsync)(imagesController_1.uploadImage));
exports.default = imagesRouter;
