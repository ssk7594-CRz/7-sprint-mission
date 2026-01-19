import { Request, Response } from 'express';
import multer from 'multer';
import { PUBLIC_PATH } from '../lib/constants';
import { imageRepository } from '../repositories/imageRepository';
import { imageService } from '../services/imageService';


export const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, PUBLIC_PATH);
    },
    filename(req, file, cb) {
      const filename = imageRepository.generateUniqueFilename(file.originalname);
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export async function uploadImage(req: Request, res: Response) {
  const imageUrl = imageService.processUpload(req.file);
  
  return res.status(201).send({ url: imageUrl });
}