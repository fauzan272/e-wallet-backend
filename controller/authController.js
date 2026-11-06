import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserByUsername } from '../models/userModel.js';
import { issueToken } from '../auth/tokenService.js';
import { HttpError } from '../utils/HttpError.js';

const DUMMY_HASH = '$2b$10$7EqJtq98hPqEX7fNZaFWoO7wK6DcuO7mEkv6JwHI0pZ62p64JI8e.';

export async function register(req, res, next) {
  try {
    // Menambahkan phone_number dari request body sesuai kolom di database Anda
    const { username, email, phone_number, password } = req.body;

    // --- VALIDASI REQUIREMENT INTERFACE ---
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'Format email tidak valid.');
    }
    if (!password || password.length < 8) {
      throw new HttpError(400, 'Password harus minimal berisi 8 karakter.');
    }
    if (!phone_number) {
      throw new HttpError(400, 'Nomor telepon wajib diisi.');
    }

    // Cek Duplikasi Username
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      throw new HttpError(400, 'Username sudah digunakan.');
    }

    // Cek Duplikasi Email
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      throw new HttpError(409, 'Email sudah digunakan.', [
        { field: "email", message: 'Gunakan email lain atau login' }
      ]);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(username, email, phone_number, passwordHash);
    
    res.status(201).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new HttpError(400, 'Email dan password wajib diisi.');
    }

    const user = await findUserByEmail(email);
    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    
    if (!user || !valid) {
      throw new HttpError(401, 'Email atau password salah.');
    }
    
    // Karena kolom role tidak ada di struktur gambar, set role default sebagai 'user'
    const token = issueToken(user.id, 'user'); 
    
    res.json({ 
      success: true, 
      data: {
        token, 
        tokenType: 'Bearer',
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          phone_number: user.phone_number
        }
      } 
    });
  } catch (error) {
    next(error);
  }
}
