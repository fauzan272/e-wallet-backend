import express from 'express';
import { fileURLToPath } from 'node:url';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js'; 

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', transactionRoutes);

app.use(express.static(fileURLToPath(new URL('../frontend/', import.meta.url))));

app.get('*any', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(fileURLToPath(new URL('../frontend/index.html', import.meta.url)));
  }
});


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
