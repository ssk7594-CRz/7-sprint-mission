import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(' DATABASE_URL is missing in .env file');
}

export const DATABASE_URL: string = process.env.DATABASE_URL;
export const PORT: number = Number(process.env.PORT) || 3000;
export const PUBLIC_PATH: string = './public';
export const STATIC_PATH: string = '/public';