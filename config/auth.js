import 'dotenv/config';

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';

export function getJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET belum diatur di .env.');
  }
  return JWT_SECRET;
}
