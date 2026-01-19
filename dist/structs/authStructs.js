"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginBodyStruct = exports.RegisterBodyStruct = void 0;
const superstruct_1 = require("superstruct");
exports.RegisterBodyStruct = (0, superstruct_1.object)({
    email: (0, superstruct_1.nonempty)((0, superstruct_1.string)()),
    nickname: (0, superstruct_1.nonempty)((0, superstruct_1.string)()),
    password: (0, superstruct_1.nonempty)((0, superstruct_1.string)()),
});
exports.LoginBodyStruct = (0, superstruct_1.object)({
    email: (0, superstruct_1.nonempty)((0, superstruct_1.string)()),
    password: (0, superstruct_1.nonempty)((0, superstruct_1.string)()),
});
