import { Request, Response } from 'express';
import { create } from 'superstruct';
import { articleService } from '../services/articleService';
import { IdParamsStruct } from '../structs/commonStructs';
import { CreateArticleBodyStruct, UpdateArticleBodyStruct } from '../structs/articlesStructs';
import UnauthorizedError from '../lib/errors/UnauthorizedError';

export async function getArticle(req: Request, res: Response) {
  const { id } = create(req.params, IdParamsStruct);
  const article = await articleService.getArticleDetail(id, req.user?.id);
  return res.send(article);
}

export async function createArticle(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  
  const data = create(req.body, CreateArticleBodyStruct);
  const article = await articleService.createArticle(data, req.user.id);
  return res.status(201).send(article);
}

export async function updateArticle(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');

  const { id } = create(req.params, IdParamsStruct);
  const data = create(req.body, UpdateArticleBodyStruct);
  
  const updated = await articleService.updateArticle(id, data, req.user.id);
  return res.send(updated);
}

export async function deleteArticle(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');

  const { id } = create(req.params, IdParamsStruct);
  await articleService.deleteArticle(id, req.user.id);
  return res.status(204).send();
}

export async function getArticles(req: Request, res: Response) {
  const query = req.query; 
  const articles = await articleService.getArticles(query, req.user?.id);
  return res.send(articles);
}