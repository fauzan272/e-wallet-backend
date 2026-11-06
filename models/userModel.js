import { db } from '../database/connection.js';

export const findUserByEmail = async (email) => {
  // Mengambil kolom yang benar-benar ada di gambar tabel Anda
  const [rows] = await db.query('SELECT id, username, email, phone_number, password FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

export const findUserByUsername = async (username) => {
  const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
  return rows[0] || null;
};

export const createUser = async (username, email, phone_number, passwordHash) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      'INSERT INTO users (username, email, phone_number, password) VALUES (?, ?, ?, ?)',
      [username, email, phone_number, passwordHash]
    );
    
    const newUserId = userResult.insertId;

    await connection.query(
      'INSERT INTO wallets (user_id, balance) VALUES (?, 0)',
      [newUserId]
    );

    await connection.commit();
    connection.release();

    return {
      id: newUserId,
      username,
      email,
      phone_number
    };

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error; // Eror mentah ditangkap oleh errorHandler
  }
};
