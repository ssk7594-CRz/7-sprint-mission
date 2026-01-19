import { Request, Response } from 'express';
import { create } from 'superstruct';
import { userService } from '../services/userService';
import { UpdateMeBodyStruct, UpdatePasswordBodyStruct, GetMyProductListParamsStruct, GetMyFavoriteListParamsStruct } from '../structs/usersStructs';
import UnauthorizedError from '../lib/errors/UnauthorizedError';

export async function getMe(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const user = await userService.getMyInfo(req.user.id);
  return res.send(user);
}

export async function updateMe(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const data = create(req.body, UpdateMeBodyStruct);
  const updatedUser = await userService.updateMyInfo(req.user.id, data);
  return res.status(200).send(updatedUser);
}

export async function updateMyPassword(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const data = create(req.body, UpdatePasswordBodyStruct);
  await userService.updatePassword(req.user.id, data);
  return res.status(200).send();
}

export async function getMyProductList(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const params = create(req.query, GetMyProductListParamsStruct);
  const result = await userService.getMyProducts(req.user.id, params);
  return res.send(result);
}

export async function getMyFavoriteList(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const params = create(req.query, GetMyFavoriteListParamsStruct);
  const result = await userService.getMyFavorites(req.user.id, params);
  return res.send(result);
}