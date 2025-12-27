const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

let doc = null;
let sheet = null;

// 初始化 Google Sheets 連線
async function initSheet() {
  if (sheet) return sheet;
  
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  
  sheet = doc.sheetsByTitle['transactions'];
  if (!sheet) {
    throw new Error('找不到 transactions 分頁，請確認 Google Sheets 設定');
  }
  
  return sheet;
}

// 產生唯一 ID
function generateId() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 取得交易紀錄
async function getTransactions(userId, role, filters = {}) {
  const sheet = await initSheet();
  const rows = await sheet.getRows();
  
  let transactions = rows.map(row => ({
    id: row.get('id'),
    user_id: row.get('user_id'),
    日期: row.get('日期'),
    代號: row.get('代號'),
    名稱: row.get('名稱'),
    類型: row.get('類型'),
    股數: row.get('股數'),
    價格: row.get('價格'),
    總金額: row.get('總金額'),
    理由: row.get('理由'),
    屬性: row.get('屬性'),
    created_at: row.get('created_at'),
    _rowIndex: row.rowNumber
  }));
  
  // 非管理員只能看自己的資料
  if (role !== 'admin') {
    transactions = transactions.filter(t => t.user_id === userId);
  }
  
  // 日期篩選
  if (filters.startDate) {
    transactions = transactions.filter(t => t.日期 >= filters.startDate);
  }
  if (filters.endDate) {
    transactions = transactions.filter(t => t.日期 <= filters.endDate);
  }
  
  // 股票代號篩選
  if (filters.stockCode) {
    transactions = transactions.filter(t => t.代號 === filters.stockCode);
  }
  
  // 按日期排序（新到舊）
  transactions.sort((a, b) => {
    if (a.日期 < b.日期) return 1;
    if (a.日期 > b.日期) return -1;
    return 0;
  });
  
  return transactions;
}

// 取得特定用戶的交易紀錄
async function getTransactionsByUserId(userId) {
  const sheet = await initSheet();
  const rows = await sheet.getRows();
  
  const transactions = rows
    .filter(row => row.get('user_id') === userId)
    .map(row => ({
      id: row.get('id'),
      user_id: row.get('user_id'),
      日期: row.get('日期'),
      代號: row.get('代號'),
      名稱: row.get('名稱'),
      類型: row.get('類型'),
      股數: row.get('股數'),
      價格: row.get('價格'),
      總金額: row.get('總金額'),
      理由: row.get('理由'),
      屬性: row.get('屬性'),
      created_at: row.get('created_at')
    }));
  
  transactions.sort((a, b) => {
    if (a.日期 < b.日期) return 1;
    if (a.日期 > b.日期) return -1;
    return 0;
  });
  
  return transactions;
}

// 新增交易紀錄
async function addTransaction(data) {
  const sheet = await initSheet();
  
  const newRow = {
    id: generateId(),
    user_id: data.user_id,
    日期: data.日期,
    代號: data.代號,
    名稱: data.名稱,
    類型: data.類型,
    股數: data.股數,
    價格: data.價格,
    總金額: data.總金額 || (parseFloat(data.股數) * parseFloat(data.價格)),
    理由: data.理由 || '',
    屬性: data.屬性 || '',
    created_at: new Date().toISOString()
  };
  
  await sheet.addRow(newRow);
  
  return { success: true, data: newRow };
}

// 更新交易紀錄
async function updateTransaction(id, data, userId, role) {
  const sheet = await initSheet();
  const rows = await sheet.getRows();
  
  const row = rows.find(r => r.get('id') === id);
  
  if (!row) {
    return { success: false, message: '找不到此筆紀錄' };
  }
  
  // 非管理員只能改自己的
  if (role !== 'admin' && row.get('user_id') !== userId) {
    return { success: false, message: '無權限修改此筆紀錄' };
  }
  
  // 更新欄位
  if (data.日期) row.set('日期', data.日期);
  if (data.代號) row.set('代號', data.代號);
  if (data.名稱) row.set('名稱', data.名稱);
  if (data.類型) row.set('類型', data.類型);
  if (data.股數) row.set('股數', data.股數);
  if (data.價格) row.set('價格', data.價格);
  if (data.總金額) row.set('總金額', data.總金額);
  if (data.理由 !== undefined) row.set('理由', data.理由);
  if (data.屬性 !== undefined) row.set('屬性', data.屬性);
  
  await row.save();
  
  return { success: true, message: '更新成功' };
}

// 刪除交易紀錄
async function deleteTransaction(id, userId, role) {
  const sheet = await initSheet();
  const rows = await sheet.getRows();
  
  const row = rows.find(r => r.get('id') === id);
  
  if (!row) {
    return { success: false, message: '找不到此筆紀錄' };
  }
  
  // 非管理員只能刪自己的
  if (role !== 'admin' && row.get('user_id') !== userId) {
    return { success: false, message: '無權限刪除此筆紀錄' };
  }
  
  await row.delete();
  
  return { success: true, message: '刪除成功' };
}

// 取得所有用戶統計
async function getAllUserStats() {
  const sheet = await initSheet();
  const rows = await sheet.getRows();

  const stats = {};

  rows.forEach(row => {
    const userId = row.get('user_id');
    const type = row.get('類型');
    const amount = parseFloat(row.get('總金額')) || 0;

    if (!stats[userId]) {
      stats[userId] = {
        userId,
        totalTransactions: 0,
        buyCount: 0,
        sellCount: 0,
        buyAmount: 0,
        sellAmount: 0
      };
    }

    stats[userId].totalTransactions++;

    if (type === 'buy') {
      stats[userId].buyCount++;
      stats[userId].buyAmount += amount;
    } else if (type === 'sell') {
      stats[userId].sellCount++;
      stats[userId].sellAmount += amount;
    }
  });

  return Object.values(stats);
}

// 取得指定分頁的資料（用於讀取 users 分頁）
async function getSheetData(sheetName) {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();

  const targetSheet = doc.sheetsByTitle[sheetName];
  if (!targetSheet) {
    throw new Error(`找不到 ${sheetName} 分頁`);
  }

  const rows = await targetSheet.getRows();

  // 取得標題列
  const headers = targetSheet.headerValues;

  // 轉換成二維陣列格式
  const data = [headers];
  rows.forEach(row => {
    const rowData = headers.map(header => row.get(header) || '');
    data.push(rowData);
  });

  return data;
}

module.exports = {
  getTransactions,
  getTransactionsByUserId,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getAllUserStats,
  getSheetData
};
