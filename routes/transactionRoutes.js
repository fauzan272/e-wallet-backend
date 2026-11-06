import { Router } from 'express';
import { body } from 'express-validator';
import { TransactionController } from '../controller/transactionController.js';
import { authenticate, authorizeRole } from '../middlewares/authenticate.js';

const router = Router();

router.use(authenticate);


router.get('/wallet', TransactionController.getWalletBalance);


router.post(
  '/topup', 
  [
    body('amount')
      .notEmpty().withMessage('Nominal tidak boleh kosong.')
      .custom((value) => {
        if (typeof value === 'string' || !Number.isInteger(value) || value <= 0) {
          throw new Error('Top-up tidak boleh angka negatif');
        }
        return true;
      })
  ],
  TransactionController.topup
);


router.post(
  '/transfer', 
  [
    body('email')
      .notEmpty().withMessage('Email penerima wajib diisi.')
      .isEmail().withMessage('Format email tidak valid.'),
    body('amount')
      .notEmpty().withMessage('Nominal tidak boleh kosong.')
      .custom((value) => {
        if (typeof value === 'string' || !Number.isInteger(value) || value <= 0) {
          throw new Error('Nominal harus berupa angka.');
        }
        return true;
      })
  ],
  TransactionController.transfer
);

router.get('/transactions', TransactionController.getMutationHistory);

export default router;
