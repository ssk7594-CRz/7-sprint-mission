import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const imageRepository = {
  generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    return `${uuidv4()}${ext}`;
  }
};