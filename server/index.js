require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const auth = require('./auth');
const sheets = require('./sheets');
const stock = require('./stock');
const exportCSV = require('./export');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 靜態檔案（根目錄）
app.use(express.static(path.join(__dirname, '..')));

// ===== 公開路由 =====

// 登入
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const result = auth.login(username, password);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

// 取得股票名稱
app.get('/api/stock/:code', (req, res) => {
  const name = stock.getStockName(req.params.code);
  res.json({ code: req.params.code, name });
});

// ===== 需要登入的路由 =====

// 取得交易紀錄
app.get('/api/transactions', auth.verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, stockCode } = req.query;
    const transactions = await sheets.getTransactions(req.user.userId, req.user.role, {
      startDate,
      endDate,
      stockCode
    });
    res.json(transactions);
  } catch (error) {
    console.error('取得交易紀錄錯誤:', error);
    res.status(500).json({ error: '取得資料失敗' });
  }
});

// 新增交易紀錄
app.post('/api/transactions', auth.verifyToken, async (req, res) => {
  try {
    const transaction = {
      ...req.body,
      user_id: req.user.userId
    };
    const result = await sheets.addTransaction(transaction);
    res.json(result);
  } catch (error) {
    console.error('新增交易紀錄錯誤:', error);
    res.status(500).json({ error: '新增失敗' });
  }
});

// 更新交易紀錄
app.put('/api/transactions/:id', auth.verifyToken, async (req, res) => {
  try {
    const result = await sheets.updateTransaction(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(403).json(result);
    }
  } catch (error) {
    console.error('更新交易紀錄錯誤:', error);
    res.status(500).json({ error: '更新失敗' });
  }
});

// 刪除交易紀錄
app.delete('/api/transactions/:id', auth.verifyToken, async (req, res) => {
  try {
    const result = await sheets.deleteTransaction(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(403).json(result);
    }
  } catch (error) {
    console.error('刪除交易紀錄錯誤:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

// ===== 管理員路由 =====

// 取得所有用戶統計
app.get('/api/admin/stats', auth.verifyToken, auth.requireAdmin, async (req, res) => {
  try {
    const stats = await sheets.getAllUserStats();
    res.json(stats);
  } catch (error) {
    console.error('取得統計錯誤:', error);
    res.status(500).json({ error: '取得統計失敗' });
  }
});

// 取得特定用戶的交易紀錄（管理員）
app.get('/api/admin/transactions/:userId', auth.verifyToken, auth.requireAdmin, async (req, res) => {
  try {
    const transactions = await sheets.getTransactionsByUserId(req.params.userId);
    res.json(transactions);
  } catch (error) {
    console.error('取得用戶交易紀錄錯誤:', error);
    res.status(500).json({ error: '取得資料失敗' });
  }
});

// ===== 匯出路由 =====

// 匯出自己的 CSV
app.get('/api/export/csv', auth.verifyToken, async (req, res) => {
  try {
    const transactions = await sheets.getTransactions(req.user.userId, 'user', {});
    const csv = exportCSV.toCSV(transactions);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${req.user.userId}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('匯出 CSV 錯誤:', error);
    res.status(500).json({ error: '匯出失敗' });
  }
});

// 匯出特定用戶的 CSV（管理員）
app.get('/api/admin/export/csv/:userId', auth.verifyToken, auth.requireAdmin, async (req, res) => {
  try {
    const transactions = await sheets.getTransactionsByUserId(req.params.userId);
    const csv = exportCSV.toCSV(transactions);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${req.params.userId}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('匯出 CSV 錯誤:', error);
    res.status(500).json({ error: '匯出失敗' });
  }
});

// 取得所有用戶清單（管理員）
app.get('/api/admin/users', auth.verifyToken, auth.requireAdmin, (req, res) => {
  const users = auth.getAllUsers();
  res.json(users);
});

// 頁面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器啟動於 http://localhost:${PORT}`);
});
