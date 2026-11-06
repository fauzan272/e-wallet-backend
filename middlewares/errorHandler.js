import { HttpError } from '../utils/HttpError.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  err = normalizeParserError(err); 
  const known = err instanceof HttpError;
  if (!known) console.error('[server]', err.name);
  res.status(known ? err.statusCode : 500).json({
    success: false,
    message: known ? err.message : 'Terjadi kesalahan pada server.',
    errors: known ? err.errors : []
  });
}

function normalizeParserError(err) {
  if (err.type === 'entity.parse.failed') {
    return new HttpError(400, 'Body JSON tidak valid.');
  }
  if (err.type === 'entity.too.large') {
    return new HttpError(413, 'Body request terlalu besar.');
  }
  return err;
}
