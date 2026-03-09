import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PUBLIC_PATH, STATIC_PATH } from '../lib/constants';
import BadRequestError from '../lib/errors/BadRequestError';
import type { Request, Response } from 'express';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;


export const upload = multer({
  storage: multer.diskStorage({
    destination(req: Request, file: Express.Multer.File, cb: DestinationCallback) {
      cb(null, PUBLIC_PATH);
    },
    filename(req: Request, file: Express.Multer.File, cb: FileNameCallback) {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },

  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
    
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new BadRequestError('Only png, jpeg, and jpg are allowed');
      return cb(err as any, false); 
    }
    cb(null, true);
  },
});


export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw new BadRequestError('파일이 업로드되지 않았습니다.');
  }

  const host = req.get('host');
  const url = `http://${host}/${STATIC_PATH}/${req.file.filename}`;
  
  return res.send({ url });
}