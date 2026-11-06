import { verifyToken } from '../auth/tokenService.js';
import { HttpError } from '../utils/HttpError.js';

export function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '');
  
  if (!match) {
    return next(new HttpError(401, 'Silakan login dengan token yang valid.'));
  }

  // PERBAIKAN: Gunakan match[1] untuk mengambil string token murni
  const claims = verifyToken(match[1]); 
  
  if (!claims) {
    return next(new HttpError(401, 'Silakan login dengan token yang valid.'));
  }
  
  req.auth = claims;
  next();
}

export function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.role) {
      return next(new HttpError(403, 'Akses ditolak. Anda tidak memiliki izin.'));
    }

    const hasRole = allowedRoles.includes(req.auth.role);
    if (!hasRole) {
      return next(new HttpError(403, 'Akses ditolak. Anda tidak memiliki hak akses yang diperlukan.'));
    }

    next();
  };
}
