import { db } from '../database/connection.js';

/**
 * Mengambil data dompet berdasarkan ID user
 */
export const findWalletByUserId = async (userId) => {
  const [wallets] = await db.query(
    'SELECT id, user_id, balance FROM wallets WHERE user_id = ?',
    [userId]
  );
  if (wallets.length === 0) return null;
  return wallets[0];
};

/**
 * Mengambil data dompet berdasarkan ID Wallet langsung
 */
export const findWalletById = async (walletId) => {
  const [wallets] = await db.query(
    'SELECT id, user_id, balance FROM wallets WHERE id = ?',
    [walletId]
  );
  if (wallets.length === 0) return null;
  return wallets[0];
};

/**
 * Proses Top-Up Saldo (Menambah ke tabel wallets & mencatat ke transactions)
 */
export const createTopup = async (userId, amount) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [wallets] = await connection.query(
      'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    if (wallets.length === 0) {
      throw new Error('Wallet tidak ditemukan untuk user ini');
    }
    const wallet = wallets[0];

    // Update saldo dompet
    await connection.query(
      'UPDATE wallets SET balance = balance + ? WHERE id = ?',
      [amount, wallet.id]
    );

    // Mencatat riwayat mutasi sesuai kolom di gambar Anda
    const [txResult] = await connection.query(
      `INSERT INTO transactions 
        (wallet_id, type, amount, related_wallet_id, description, created_at) 
       VALUES (?, 'topup', ?, NULL, 'Top up saldo dompet', NOW())`,
      [wallet.id, amount]
    );

    await connection.commit();
    connection.release();

    return {
      id: txResult.insertId,
      wallet_id: wallet.id,
      type: 'topup',
      amount: amount,
      new_balance: wallet.balance + amount
    };

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

/**
 * Proses Transfer Uang Antar-User (Menerapkan prinsip Transactional Integrity)
 */
export const createTransfer = async (senderUserId, recipientEmail, amount) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Ambil data wallet pengirim (User A)
    const [senderWallets] = await connection.query(
      'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [senderUserId]
    );
    if (senderWallets.length === 0) {
      throw new Error('Dompet pengirim tidak ditemukan');
    }
    const senderWallet = senderWallets[0];

    // 2. Cari data user penerima berdasarkan email
    const [recipients] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [recipientEmail]
    );
    if (recipients.length === 0) {
      const err = new Error('Email penerima tidak ditemukan');
      err.statusCode = 400; 
      throw err;
    }
    const recipient = recipients[0];

    if (recipient.id === senderUserId) {
      const err = new Error('Tidak bisa mentransfer ke akun sendiri');
      err.statusCode = 400;
      throw err;
    }

    // 3. Ambil data wallet penerima (User B)
    const [recipientWallets] = await connection.query(
      'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [recipient.id]
    );
    if (recipientWallets.length === 0) {
      throw new Error('Dompet penerima tidak ditemukan');
    }
    const recipientWallet = recipientWallets[0];

    // 4. Potong saldo pengirim & Tambah saldo penerima
    await connection.query(
      'UPDATE wallets SET balance = balance - ? WHERE id = ?',
      [amount, senderWallet.id]
    );
    await connection.query(
      'UPDATE wallets SET balance = balance + ? WHERE id = ?',
      [amount, recipientWallet.id]
    );

    // 5. Catat mutasi keluar untuk pengirim (transfer_out) sesuai kolom di gambar Anda
    const [senderTx] = await connection.query(
      `INSERT INTO transactions 
        (wallet_id, type, amount, related_wallet_id, description, created_at) 
       VALUES (?, 'transfer_out', ?, ?, ?, NOW())`,
      [senderWallet.id, amount, recipientWallet.id, `Transfer ke ${recipientEmail}`]
    );

    // 6. Catat mutasi masuk untuk penerima (transfer_in) sesuai kolom di gambar Anda
    await connection.query(
      `INSERT INTO transactions 
        (wallet_id, type, amount, related_wallet_id, description, created_at) 
       VALUES (?, 'transfer_in', ?, ?, ?, NOW())`,
      [recipientWallet.id, amount, senderWallet.id, `Terima transfer dari wallet id ${senderWallet.id}`]
    );

    await connection.commit();
    connection.release();

    return {
      id: senderTx.insertId,
      wallet_id: senderWallet.id,
      type: 'transfer_out',
      amount: amount,
      related_wallet_id: recipientWallet.id,
      remaining_balance: senderWallet.balance - amount
    };

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

/**
 * Mengambil data riwayat mutasi berdasarkan ID wallet milik user yang login
 */
export const findMutationsByWalletId = async (walletId) => {
  const [mutations] = await db.query(
    `SELECT t.id, t.wallet_id, t.type, t.amount, t.related_wallet_id, t.description, t.created_at, u.username AS lawan_transaksi
     FROM transactions t
     LEFT JOIN wallets w ON t.related_wallet_id = w.id
     LEFT JOIN users u ON w.user_id = u.id
     WHERE t.wallet_id = ?
     ORDER BY t.id DESC`,
    [walletId]
  );
  return mutations;
};
