import { prismaClient } from '../lib/prismaClient';
import { verifyAccessToken } from '../lib/token';
import { ACCESS_TOKEN_COOKIE_NAME } from '../lib/constants';
import { Request, Response, NextFunction } from 'express';


interface AuthOptions {
  optional?: boolean;
}

function authenticate(options: AuthOptions = { optional: false }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies[ACCESS_TOKEN_COOKIE_NAME];

    if (!accessToken) {
      if (options.optional) {
        return next();
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const { userId } = verifyAccessToken(accessToken);
      const user = await prismaClient.user.findUnique({ where: { id: userId } });

      if (!user) {
        if (options.optional) {
          return next();
        }
        return res.status(401).json({ message: 'Unauthorized' });
      }

      req.user = user;
      
      return next();
    } catch (error) {
      if (options.optional) {
        return next();
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

export default authenticate;
