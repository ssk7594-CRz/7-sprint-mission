import { Request, Response } from 'express';
import { create } from 'superstruct';
import { productService } from '../services/productService';
import { IdParamsStruct } from '../structs/commonStructs';
import { CreateProductBodyStruct, GetProductListParamsStruct, UpdateProductBodyStruct } from '../structs/productsStruct';
import UnauthorizedError from '../lib/errors/UnauthorizedError';

export async function getProduct(req: Request, res: Response) {
  const { id } = create(req.params, IdParamsStruct);
  const result = await productService.getProductDetail(id, req.user?.id);
  return res.send(result);
}

export async function getProductList(req: Request, res: Response) {
  const params = create(req.query, GetProductListParamsStruct);
  const result = await productService.getProductList(params, req.user?.id);
  return res.send(result);
}

export async function createProduct(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const data = create(req.body, CreateProductBodyStruct);
  const product = await productService.createProduct(data, req.user.id);
  return res.status(201).send(product);
}

export async function updateProduct(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const { id } = create(req.params, IdParamsStruct);
  const data = create(req.body, UpdateProductBodyStruct);
  const updated = await productService.updateProduct(id, data, req.user.id);
  return res.send(updated);
}

export async function deleteProduct(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const { id } = create(req.params, IdParamsStruct);
  await productService.deleteProduct(id, req.user.id);
  return res.status(204).send();
}

export async function createFavorite(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const { id: productId } = create(req.params, IdParamsStruct);
  await productService.toggleFavorite(productId, req.user.id, true);
  return res.status(201).send();
}

export async function deleteFavorite(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError('Unauthorized');
  const { id: productId } = create(req.params, IdParamsStruct);
  await productService.toggleFavorite(productId, req.user.id, false);
  return res.status(204).send();
}