# 股票交易記錄系統

多人股票交易記錄系統，支援登入驗證、交易記錄管理、搜尋篩選、CSV 匯出。

## 功能

### 一般用戶
- 登入/登出
- 新增交易紀錄（日期、股票代號自動帶名稱、買/賣、股數、價格、總金額自動計算、理由、屬性）
- 搜尋自己的紀錄（日期區間、股票代號）
- 編輯/刪除自己的紀錄
- 匯出自己的 CSV

### 管理員
- 以上全部功能
- 查看所有用戶統計
- 匯出任意用戶資料

## 檔案結構

```
stock-tracker/
├── server/
│   ├── index.js          # Express 主程式
│   ├── auth.js           # 登入驗證
│   ├── sheets.js         # Google Sheets 操作
│   ├── stock.js          # 台股名稱查詢
│   └── export.js         # CSV 匯出
├── js/
│   └── app.js            # 前端共用邏輯
├── index.html            # 登入頁
├── dashboard.html        # 主功能頁
├── admin.html            # 管理員頁
├── stocks.json           # 台股代碼清單
├── .env.example          # 環境變數範本
├── .gitignore
├── package.json
└── README.md
```

## 環境變數設定

複製 `.env.example` 為 `.env`，填入實際值：

```env
# JWT 密鑰
JWT_SECRET=your_random_secret_key_here

# Google Sheets 設定
GOOGLE_SHEET_ID=你的Google試算表ID
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 管理員帳號
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# 一般用戶（USER_帳號=密碼）
USER_joseph=password123
USER_mary=password456
```

## Google Sheets 設定

### 1. 建立試算表

建立新的 Google Sheets，新增分頁命名為 `transactions`。

### 2. 設定欄位標題（第一列）

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| id | user_id | 日期 | 代號 | 名稱 | 類型 | 股數 | 價格 | 總金額 | 理由 | 屬性 | created_at |

### 3. 建立服務帳戶

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google Sheets API**
4. 建立服務帳戶（IAM → 服務帳戶 → 建立）
5. 建立金鑰（JSON 格式）下載
6. 從 JSON 取得 `client_email` 和 `private_key`

### 4. 分享試算表

將試算表分享給服務帳戶 email（編輯權限）。

## Zeabur 部署

### 1. 上傳到 GitHub

### 2. 建立 Zeabur 專案
1. 登入 [Zeabur](https://zeabur.com/)
2. 建立新專案 → 從 GitHub 部署

### 3. 設定環境變數
在 Zeabur 設定中加入所有 `.env` 的變數

### 4. 部署完成
Zeabur 自動偵測 Node.js 並部署

## 本機開發

```bash
npm install
npm run dev
```

網址：http://localhost:3000

## 新增用戶

1. 編輯 `.env`
2. 加入 `USER_新帳號=新密碼`
3. 重新部署
