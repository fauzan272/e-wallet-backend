import { body } from 'express-validator';

const username = () => body('username').isString().withMessage('Username wajib berupa teks.').bail()
  .trim().isLength({ min: 3, max: 50 }).withMessage('Username harus 3 sampai 50 karakter.');

const phone_number = () => body('phone_number').isString().withMessage('Nomor telepon wajib berupa teks.').bail()
  .trim().isLength({ min: 10, max: 20 }).withMessage('Nomor telepon harus 10 sampai 20 karakter.');

const email = () => body('email').isString().withMessage('Email wajib berupa teks.').bail()
  .trim().isLength({ max: 254 }).withMessage('Email terlalu panjang.').bail()
  .isEmail().withMessage('Format email tidak valid.').bail().toLowerCase();

const password = () => body('password').isString().withMessage('Password wajib berupa teks.').bail()
  .isLength({ min: 8 }).withMessage('Password minimal 8 karakter.').bail()
  .custom((value) => {
    // Memastikan jika panjang byte melebihi 72, sistem langsung melempar error ke express-validator
    if (Buffer.byteLength(value, 'utf8') > 72) {
      throw new Error('Password maksimal 72 byte UTF-8.');
    }
    return true;
  });

export const validateRegister = () => [username(), email(), phone_number(), password()];
export const validateLogin = () => [email(), password()];