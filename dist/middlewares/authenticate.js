"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = require("../lib/prismaClient");
const token_1 = require("../lib/token");
const constants_1 = require("../lib/constants");
function authenticate(options = { optional: false }) {
    return async (req, res, next) => {
        const accessToken = req.cookies[constants_1.ACCESS_TOKEN_COOKIE_NAME];
        if (!accessToken) {
            if (options.optional) {
                return next();
            }
            return res.status(401).json({ message: 'Unauthorized' });
        }
        try {
            const { userId } = (0, token_1.verifyAccessToken)(accessToken);
            const user = await prismaClient_1.prismaClient.user.findUnique({ where: { id: userId } });
            if (!user) {
                if (options.optional) {
                    return next();
                }
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.user = user;
            return next();
        }
        catch (error) {
            if (options.optional) {
                return next();
            }
            return res.status(401).json({ message: 'Unauthorized' });
        }
    };
}
exports.default = authenticate;
