"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMyFavoriteListParamsStruct = exports.GetMyProductListParamsStruct = exports.UpdatePasswordBodyStruct = exports.UpdateMeBodyStruct = void 0;
const superstruct_1 = require("superstruct");
const commonStructs_js_1 = require("./commonStructs.js");
exports.UpdateMeBodyStruct = (0, superstruct_1.partial)((0, superstruct_1.object)({
    email: (0, superstruct_1.string)(),
    nickname: (0, superstruct_1.string)(),
    image: (0, superstruct_1.nullable)((0, superstruct_1.string)()),
}));
exports.UpdatePasswordBodyStruct = (0, superstruct_1.object)({
    password: (0, superstruct_1.string)(),
    newPassword: (0, superstruct_1.string)(),
});
exports.GetMyProductListParamsStruct = commonStructs_js_1.PageParamsStruct;
exports.GetMyFavoriteListParamsStruct = commonStructs_js_1.PageParamsStruct;
