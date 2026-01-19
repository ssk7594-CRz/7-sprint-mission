// import { Request, Response } from 'express';
// import { create } from 'superstruct';
// import { likeService } from '../services/likeService'; 
// import { IdParamsStruct } from '../structs/commonStructs';
// import UnauthorizedError from '../lib/errors/UnauthorizedError';

// export async function createLike(req: Request, res: Response) {
//   if (!req.user) throw new UnauthorizedError('Unauthorized');

//   const { id: articleId } = create(req.params, IdParamsStruct);
  
//   const like = await likeService.createLike(articleId, req.user.id);
//   return res.status(201).send(like);
// }

// export async function deleteLike(req: Request, res: Response) {
//   if (!req.user) throw new UnauthorizedError('Unauthorized');

//   const { id: articleId } = create(req.params, IdParamsStruct);
  
//   await likeService.deleteLike(articleId, req.user.id);
//   return res.status(204).send();
// }