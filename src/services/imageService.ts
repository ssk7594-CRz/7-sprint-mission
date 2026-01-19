import { STATIC_PATH } from '../lib/constants';
import BadRequestError from '../lib/errors/BadRequestError';

export const imageService = {
  processUpload(file?: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestError('File is required');
    }

    const url = `${STATIC_PATH}/${file.filename}`;
    
    return url;
  }
};