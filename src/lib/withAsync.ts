import { Request, Response, NextFunction, RequestHandler } from 'express';

export const withAsync = (fn: Function): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};