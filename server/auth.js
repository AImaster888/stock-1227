const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';

// 從環境變數讀取所有用戶
function getUsers() {
  const users = {};
  
  // 管理員帳號
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    users[process.env.ADMIN_USERNAME] = {
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      displayName: '管理員'
    };
  }
  
  // 一般用戶（USER_xxx=password 格式）
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('USER_')) {
      const username = key.replace('USER_', '').toLowerCase();
      users[username] = {
        password: process.env[key],
        role: 'user',
        displayName: username
      };
    }
  });
  
  return users;
}

// 登入
function login(username, password) {
  const users = getUsers();
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
function getAllUsers() {
  const users = getUsers();
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
