require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const devRoutes = require('./routes/devRoutes');
const securityRoutes = require('./routes/securityRoutes');
const depositRoutes = require('./routes/depositRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const systemAccountService = require('./services/systemAccountService');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/transfers', transactionRoutes);
app.use('/api/transactions', transactionRoutes); // Maps both transfers and transactions to same router for simplicity
app.use('/api/admin', adminRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Bootstrap System Accounts before listening
systemAccountService.bootstrapSystemAccounts().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to bootstrap system accounts:', err);
  process.exit(1);
});
