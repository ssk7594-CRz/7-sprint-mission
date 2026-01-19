"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NotFoundError extends Error {
    constructor(modelName, id) {
        super(`${modelName} with id ${id} not found`);
        this.name = 'NotFoundError';
    }
}
exports.default = NotFoundError;
