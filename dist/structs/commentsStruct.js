"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCommentBodyStruct = exports.GetCommentListParamsStruct = exports.CreateCommentBodyStruct = void 0;
const superstruct_1 = require("superstruct");
const commonStructs_1 = require("./commonStructs");
exports.CreateCommentBodyStruct = (0, superstruct_1.object)({
    content: (0, superstruct_1.nonempty)((0, superstruct_1.string)()),
});
exports.GetCommentListParamsStruct = commonStructs_1.CursorParamsStruct;
exports.UpdateCommentBodyStruct = (0, superstruct_1.partial)(exports.CreateCommentBodyStruct);
