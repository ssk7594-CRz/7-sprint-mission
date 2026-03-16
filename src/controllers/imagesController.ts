import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PUBLIC_PATH, STATIC_PATH } from '../lib/constants';
import BadRequestError from '../lib/errors/BadRequestError';
import type { Request, Response } from 'express';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ─── 파일 필터 (공통) ─────────────────────────────────────────────
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestError('Only png, jpeg, and jpg are allowed') as any, false);
  }
  cb(null, true);
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

// ─── 환경에 따라 storage 분기 ─────────────────────────────────────
const storage = IS_PRODUCTION
  ? multer.memoryStorage()  // S3로 전송하기 위해 메모리에 저장
  : multer.diskStorage({
      destination(req: Request, file: Express.Multer.File, cb: DestinationCallback) {
        cb(null, PUBLIC_PATH);
      },
      filename(req: Request, file: Express.Multer.File, cb: FileNameCallback) {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      },
    });

export const upload = multer({ storage, limits, fileFilter });

// ─── 업로드 핸들러 ────────────────────────────────────────────────
export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw new BadRequestError('파일이 업로드되지 않았습니다.');
  }

  if (IS_PRODUCTION) {
    // ── S3 업로드 ──────────────────────────────────────────────────
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const ext = path.extname(req.file.originalname);
    const key = `uploads/${uuidv4()}${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return res.send({ url });

  } else {
    // ── 로컬 디스크 저장 (개발 환경) ──────────────────────────────
    const host = req.get('host');
    const url = `http://${host}${STATIC_PATH}/${req.file.filename}`;
    return res.send({ url });
  }
}