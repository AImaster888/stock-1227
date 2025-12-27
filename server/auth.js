const jwt = require('jsonwebtoken');
const { getSheetData } = require('./sheets');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';

// 從 Google Sheets 讀取所有用戶
async function getUsers() {
  try {
    const data = await getSheetData('users');
    const users = {};

    // 跳過標題列，從第二列開始
    for (let i = 1; i < data.length; i++) {
      const [username, password, role, status] = data[i];

      // 只加入啟用狀態的用戶
      if (status === 'active' && username && password) {
        users[username.toLowerCase()] = {
          password: password,
          role: role || 'user',
          displayName: username
        };
      }
    }

    return users;
  } catch (error) {
    console.error('讀取用戶資料失敗:', error);
    return {};
  }
}

// 登入
async function login(username, password) {
  const users = await getUsers();
  const user = users[username.toLowerCase()];

  if (!user || user.password !== password) {
    return { success: false, message: '帳號或密碼錯誤' };
  }

  const token = jwt.sign(
    {
      userId: username.toLowerCase(),
      role: user.role,
      displayName: user.displayName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    success: true,
    token,
    user: {
      userId: username.toLowerCase(),
      role: user.role,
      displayName: user.displayName
    }
  };
}

// 驗證 Token（中介軟體）
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供認證資訊' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '認證失敗，請重新登入' });
  }
}

// 檢查管理員權限（中介軟體）
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理員權限' });
  }
  next();
}

// 取得所有用戶清單（不含密碼）
async function getAllUsers() {
  const users = await getUsers();
  return Object.keys(users).map(username => ({
    userId: username,
    role: users[username].role,
    displayName: users[username].displayName
  }));
}

module.exports = {
  login,
  verifyToken,
  requireAdmin,
  getAllUsers
};
