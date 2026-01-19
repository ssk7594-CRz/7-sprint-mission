"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadImage = uploadImage;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const constants_1 = require("../lib/constants");
const BadRequestError_1 = __importDefault(require("../lib/errors/BadRequestError"));
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const FILE_SIZE_LIMIT = 5 * 1024 * 1024;
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination(req, file, cb) {
            cb(null, constants_1.PUBLIC_PATH);
        },
        filename(req, file, cb) {
            const ext = path_1.default.extname(file.originalname);
            const filename = `${(0, uuid_1.v4)()}${ext}`;
            cb(null, filename);
        },
    }),
    limits: {
        fileSize: FILE_SIZE_LIMIT,
    },
    fileFilter: function (req, file, cb) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            const err = new BadRequestError_1.default('Only png, jpeg, and jpg are allowed');
            return cb(err);
        }
        cb(null, true);
    },
});
async function uploadImage(req, res) {
    if (!req.file) {
        throw new BadRequestError_1.default('파일이 업로드 되지 않았습니다.');
    }
    const host = req.get('host');
    const filePath = req.file.filename;
    const url = `http://${host}${constants_1.STATIC_PATH}/${filePath}`;
    return res.send({ url });
}
