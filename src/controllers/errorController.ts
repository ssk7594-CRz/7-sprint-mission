import { StructError } from 'superstruct';
import type { Request, Response, NextFunction } from 'express'; // ✅ Express 타입 임포트
import BadRequestError from '../lib/errors/BadRequestError';
import NotFoundError from '../lib/errors/NotFoundError';

export function defaultNotFoundHandler(req: Request, res: Response, _next: NextFunction) {
  return res.status(404).send({ message: 'Not found' });
}

export function globalErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof StructError || err instanceof BadRequestError) {
    return res.status(400).send({ message: err.message });
  }

  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return res.status(400).send({ message: 'Invalid JSON' });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).send({ message: err.message });
  }

  if (err.code) {
    console.error('DB/Code Error:', err);
    return res.status(500).send({ message: 'Failed to process data' });
  }

  console.error('Unexpected Error:', err);
  return res.status(500).send({ message: 'Internal server error' });
}