import * as TransactionModel from '../models/transactionModels.js';
import { HttpError } from '../utils/HttpError.js';

export const TransactionController = {
  // 1. GET /api/wallet -> Lihat saldo saat ini (Poin b.i)
  getWalletBalance: async (req, res, next) => {
    try {
      const userId = req.auth?.id || req.auth?.user?.id || req.auth?.sub;

      if (!userId) {
        throw new HttpError(401, 'Unauthorized. Token tidak valid atau kedaluwarsa.');
      }

      const wallet = await TransactionModel.findWalletByUserId(userId);
      if (!wallet) {
        throw new HttpError(404, 'Dompet tidak ditemukan.');
      }

      res.status(200).json({
        success: true,
        message: "Saldo berhasil diambil",
        data: {
          balance: wallet.balance
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. POST /api/topup -> Tambah saldo (Poin b.ii)
  topup: async (req, res, next) => {
    try {
      const userId = req.auth?.id || req.auth?.user?.id || req.auth?.sub;
      const { amount } = req.body;

      if (!userId) {
        throw new HttpError(401, 'Unauthorized.');
      }

      // --- VALIDASI INPUT NOMINAL TOPUP ---
      if (amount === undefined || amount === null || amount === '') {
        throw new HttpError(400, 'Nominal tidak boleh kosong.');
      }
      if (typeof amount === 'string' || !Number.isInteger(amount)) {
        throw new HttpError(400, 'Nominal harus berupa angka.');
      }
      if (amount <= 0) {
        throw new HttpError(400, 'Top-up tidak boleh angka negatif');
      }

      const topup = await TransactionModel.createTopup(userId, amount);

      res.status(200).json({
        success: true,
        message: "Top up berhasil diproses",
        data: topup
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. POST /api/transfer -> Kirim saldo ke user lain (Poin b.iii)
  transfer: async (req, res, next) => {
    try {
      const senderUserId = req.auth?.id || req.auth?.user?.id || req.auth?.sub;
      const { email, amount } = req.body;

      if (!senderUserId) {
        throw new HttpError(401, 'Unauthorized.');
      }

      // --- VALIDASI INPUT DI BACKEND (Expected Behavior System dari lembar soal) ---
      if (amount === undefined || amount === null || amount === '') {
        throw new HttpError(400, 'Nominal tidak boleh kosong.');
      }
      if (typeof amount === 'string' || !Number.isInteger(amount)) {
        throw new HttpError(400, 'Nominal harus berupa angka.');
      }
      if (amount <= 0) {
        throw new HttpError(400, 'Nominal harus berupa angka.'); // Ekspektasi pesan error nominal minus/simbol
      }
      if (!email) {
        throw new HttpError(400, 'Email penerima wajib diisi.');
      }

      // Ambil dompet pengirim untuk melakukan pengecekan saldo
      const wallet = await TransactionModel.findWalletByUserId(senderUserId);
      
      // --- VALIDASI KETAT: Saldo tidak boleh minus ---
      if (!wallet || wallet.balance < amount) {
        throw new HttpError(422, 'Nominal melebihi batas maksimum transaksi.');
      }

      // Jalankan logika transaksi
      const transfer = await TransactionModel.createTransfer(senderUserId, email, amount);

      res.status(200).json({
        success: true,
        message: "Transfer berhasil diproses",
        data: transfer
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. GET /api/transactions -> Lihat riwayat mutasi (Poin b.iv & Security)
  getMutationHistory: async (req, res, next) => {
    try {
      const userId = req.auth?.id || req.auth?.user?.id || req.auth?.sub;

      if (!userId) {
        throw new HttpError(401, 'Unauthorized.');
      }

      const wallet = await TransactionModel.findWalletByUserId(userId);
      if (!wallet) {
        throw new HttpError(404, 'Dompet tidak ditemukan.');
      }

      // SECURITY: Dikunci berdasarkan wallet_id milik user yang sedang aktif login
      const history = await TransactionModel.findMutationsByWalletId(wallet.id);

      res.status(200).json({
        success: true,
        message: "Riwayat mutasi berhasil diambil",
        data: history
      });
    } catch (err) {
      next(err);
    }
  }
};
