import * as UserModel from '../models/userModel.js';

export const UserController = {
  getUsers: async (req, res, next) => {
    try {
      const users = await UserModel.getAllUsers();
      res.status(200).json({ 
        status: 'success', 
        message: 'Data users berhasil diambil', 
        data: users 
      });
    } catch (err) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Gagal mengambil data users', 
        error: err.message 
      });
    }
  }
};
