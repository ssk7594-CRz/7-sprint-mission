import e, { Request, Response } from 'express';
import { create } from 'superstruct';
import { commentService } from '../services/commentService';
import { IdParamsStruct } from '../structs/commonStructs';
import { CreateCommentBodyStruct, GetCommentListParamsStruct } from '../structs/commentsStruct';
import UnauthorizedError from '../lib/errors/UnauthorizedError';

export async function createComment(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');

  const { id: articleId } = create(req.params, IdParamsStruct);
  const { content } = create(req.body, CreateCommentBodyStruct);

  const createdComment = await commentService.createComment(articleId, content, req.user.id);
  return res.status(201).send(createdComment);
}

export async function getCommentList(req: Request, res: Response) {
  const { id: articleId } = create(req.params, IdParamsStruct);
  const { cursor, limit } = create(req.query, GetCommentListParamsStruct);

  const result = await commentService.getCommentList(articleId, limit, cursor);
  return res.send(result);
}
