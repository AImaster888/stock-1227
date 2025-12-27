# 股票交易記錄系統

多人股票交易記錄系統，支援登入驗證、交易記錄管理、股票代號自動查詢名稱、搜尋篩選、CSV 匯出等功能。使用 Google Sheets 作為資料庫，支援 ETF 與一般股票。

## 功能特色

### 一般用戶功能
- ✅ 登入/登出（JWT 認證，7 天有效期）
- ✅ 新增交易紀錄
  - 日期選擇
  - 股票代號（自動查詢對應名稱，支援 ETF）
  - 買入/賣出類型
  - 股數、價格（總金額自動計算）
  - 理由、屬性備註
- ✅ 查看自己的交易紀錄
- ✅ 搜尋篩選（日期區間、股票代號）
- ✅ 編輯/刪除自己的紀錄
- ✅ 匯出自己的 CSV

### 管理員功能
- ✅ 一般用戶所有功能
- ✅ 查看所有用戶統計（交易筆數、買賣金額）
- ✅ 查看任意用戶的交易紀錄
- ✅ 匯出任意用戶的 CSV

### 用戶管理
- ✅ 在 Google Sheets 中管理用戶帳號密碼
- ✅ 無需修改程式碼或重新部署即可新增/停用用戶
- ✅ 支援 admin 和 user 兩種角色

### 股票資料
- ✅ 內建 100+ 台股代碼與名稱
- ✅ 支援常見 ETF（0050、0056、00878、00888、00919、00929、00940 等）
- ✅ 支援 ETF 前導零處理（006208、00888）

## 技術架構

- **後端**: Node.js + Express
- **認證**: JWT (JSON Web Token)
- **資料庫**: Google Sheets API
- **前端**: 原生 HTML/CSS/JavaScript（無框架）
- **部署**: Zeabur / 任何 Node.js 環境

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定 Google Sheets

詳見下方「Google Sheets 設定」章節。

### 3. 設定環境變數

複製 `.env.example` 為 `.env`，填入以下 4 個變數：

```env
JWT_SECRET=your_random_secret_key_here_at_least_32_chars
GOOGLE_SHEET_ID=你的Google試算表ID
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問：http://localhost:3000

## 環境變數設定

系統只需要 **4 個環境變數**，無需在環境變數中設定用戶帳號密碼。

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `JWT_SECRET` | JWT 加密密鑰（建議 32 字元以上） | `your_random_secret_key_here` |
| `GOOGLE_SHEET_ID` | Google Sheets 試算表 ID | `1AbC...XyZ` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google 服務帳戶 Email | `xxx@xxx.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Google 服務帳戶私鑰 | `"-----BEGIN PRIVATE KEY-----\n..."` |

**注意**：
- `GOOGLE_PRIVATE_KEY` 必須包含雙引號，並保留 `\n` 換行符號
- 從 Google Cloud 下載的 JSON 金鑰檔案中可找到這些值

## Google Sheets 設定

### 步驟 1：建立 Google Sheets 試算表

1. 前往 [Google Sheets](https://sheets.google.com/)
2. 建立新的試算表
3. 從網址列複製試算表 ID
   - 網址格式：`https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - 複製 `{SHEET_ID}` 部分

### 步驟 2：建立兩個分頁

**⚠️ 重要：分頁名稱必須完全一致**

系統會根據分頁名稱尋找資料，名稱必須使用以下指定名稱（**區分大小寫，不能有空格或多餘字元**）：
- ✅ `transactions`（正確）
- ❌ `transaction`、`Transactions`、`交易紀錄` 等（錯誤，系統找不到）

#### 分頁 1：`transactions`（交易紀錄）

**分頁名稱**：必須命名為 `transactions`（全小寫，不能改）

第一列設定以下欄位標題：

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| id | user_id | 日期 | 代號 | 名稱 | 類型 | 股數 | 價格 | 總金額 | 理由 | 屬性 | created_at |

**⚠️ 重要：設定「代號」欄位格式為純文字**

1. 選取整個 **D 欄**（代號欄位）
2. 點選上方選單：**格式 → 數值 → 純文字**
3. 這樣才能保留 ETF 的前導零（00888、006208）

如果不設定，Google Sheets 會自動把 `00888` 變成 `888`，`006208` 變成 `6208`。

#### 分頁 2：`users`（用戶管理）

**分頁名稱**：必須命名為 `users`（全小寫，不能改）

第一列設定以下欄位標題：

| A | B | C | D |
|---|---|---|---|
| username | password | role | status |

**範例資料**：

| username | password | role | status |
|----------|----------|------|--------|
| admin | admin123 | admin | active |
| joseph | pass123 | user | active |
| mary | pass456 | user | active |
| test | test | user | inactive |

**說明**：
- `username`：登入帳號
- `password`：登入密碼（明文儲存，建議使用強密碼）
- `role`：角色，可選 `admin` 或 `user`
- `status`：狀態，只有 `active` 的用戶可以登入

### 步驟 3：建立 Google Cloud 服務帳戶

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案（或選擇現有專案）
3. 啟用 **Google Sheets API**
   - 左側選單 → API 和服務 → 程式庫
   - 搜尋「Google Sheets API」→ 啟用
4. 建立服務帳戶
   - 左側選單 → IAM 與管理 → 服務帳戶
   - 點選「建立服務帳戶」
   - 填入名稱（例如：stock-tracker）
   - 點選「建立並繼續」→ 略過權限設定 → 完成
5. 建立金鑰
   - 點選剛建立的服務帳戶
   - 切換到「金鑰」分頁
   - 點選「新增金鑰」→ 建立新的金鑰
   - 選擇「JSON」格式 → 建立
   - 下載的 JSON 檔案包含 `client_email` 和 `private_key`

### 步驟 4：分享試算表給服務帳戶

1. 開啟剛建立的 Google Sheets
2. 點選右上角「共用」
3. 將服務帳戶的 Email（從 JSON 檔案中的 `client_email`）加入
4. 權限設定為「編輯者」
5. 取消勾選「通知使用者」
6. 點選「共用」

## Zeabur 部署

### 1. 上傳到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的帳號/你的repo.git
git push -u origin main
```

### 2. 建立 Zeabur 專案

1. 登入 [Zeabur](https://zeabur.com/)
2. 點選「New Project」
3. 點選「Deploy New Service」
4. 選擇「GitHub」→ 授權並選擇你的 repository
5. Zeabur 會自動偵測為 Node.js 專案並開始部署

### 3. 設定環境變數

1. 在 Zeabur 專案中點選「Variables」
2. 點選「Batch Edit」（批次編輯）
3. 貼上你的 `.env` 內容（4 個變數）
4. 點選「Save」

**提示**：可以直接複製整個 `.env` 檔案內容貼上，Zeabur 會自動解析。

### 4. 部署完成

Zeabur 會自動：
- 安裝 npm 依賴
- 執行 `npm start`
- 提供公開網址

每次 push 到 GitHub，Zeabur 會自動重新部署。

## 本機開發

### 安裝依賴
```bash
npm install
```

### 開發模式（自動重啟）
```bash
npm run dev
```

### 正式執行
```bash
npm start
```

## 使用說明

### 新增用戶

1. 開啟 Google Sheets 的 `users` 分頁
2. 新增一列資料，填入：
   - username（帳號）
   - password（密碼）
   - role（`admin` 或 `user`）
   - status（`active` 或 `inactive`）
3. 儲存後即可使用新帳號登入
4. **無需重新部署或修改程式碼**

### 停用用戶

1. 將 `users` 分頁中該用戶的 `status` 改為 `inactive`
2. 該用戶將無法登入

### 新增股票代號

系統內建 100+ 台股與 ETF 代碼。如需新增：

1. 編輯 `stocks.json`
2. 加入新的代號與名稱：
   ```json
   {
     "2330": "台積電",
     "0050": "元大台灣50",
     "新代號": "股票名稱"
   }
   ```
3. 提交並推送到 GitHub（Zeabur 自動部署）

### ETF 前導零問題處理

**問題**：輸入 `00888` 時，HTML input 欄位會自動移除前導零變成 `888`。

**解決方案**：系統已內建處理

1. `stocks.json` 中同時包含完整代號和去掉前導零的版本：
   ```json
   {
     "00888": "永豐台灣ESG",
     "888": "永豐台灣ESG",
     "006208": "富邦台50",
     "6208": "富邦台50"
   }
   ```

2. **重要**：在 Google Sheets 的 `transactions` 分頁中，**必須**將「代號」欄（D 欄）格式設定為**純文字**：
   - 選取整個 D 欄
   - 上方選單：格式 → 數值 → 純文字

3. 使用者輸入時：
   - 輸入 `888` 或 `00888` 都能查到「永豐台灣ESG」
   - 系統會保存輸入的完整代號
   - 只要 Google Sheets 欄位格式正確，就能保留前導零

**如果已經有資料被吃掉前導零**：
- 將 D 欄格式改為純文字
- 手動在受影響的儲存格前面加上 `'`（單引號）
- 例如：`'00888`、`'006208`
- 或直接重新輸入完整代號

## 檔案結構

```
stock-1227/
├── server/
│   ├── index.js          # Express 主程式、路由定義
│   ├── auth.js           # JWT 認證、用戶管理
│   ├── sheets.js         # Google Sheets API 操作
│   ├── stock.js          # 股票代號查詢
│   └── export.js         # CSV 匯出功能
├── js/
│   └── app.js            # 前端共用邏輯（認證、API 呼叫、股票查詢）
├── index.html            # 登入頁面
├── dashboard.html        # 一般用戶主頁面
├── admin.html            # 管理員後台
├── stocks.json           # 台股與 ETF 代碼清單
├── .env                  # 環境變數（不納入版控）
├── .env.example          # 環境變數範本
├── .gitignore
├── package.json
└── README.md
```

## API 端點

### 公開路由

- `POST /api/login` - 登入
- `GET /api/stock/:code` - 查詢股票名稱

### 認證路由（需要 JWT token）

- `GET /api/transactions` - 取得自己的交易紀錄
- `POST /api/transactions` - 新增交易紀錄
- `PUT /api/transactions/:id` - 更新交易紀錄
- `DELETE /api/transactions/:id` - 刪除交易紀錄
- `GET /api/export/csv` - 匯出自己的 CSV

### 管理員路由（需要 admin 角色）

- `GET /api/admin/stats` - 取得所有用戶統計
- `GET /api/admin/users` - 取得用戶清單
- `GET /api/admin/transactions/:userId` - 取得特定用戶的交易紀錄
- `GET /api/admin/export/csv/:userId` - 匯出特定用戶的 CSV

## 常見問題

### Q1：為什麼股票代號的前導零會消失？

**A**：這是 Google Sheets 的數字格式問題。必須將 `transactions` 分頁的「代號」欄（D 欄）格式改為**純文字**：

1. 選取整個 D 欄
2. 上方選單：格式 → 數值 → 純文字
3. 已存在的錯誤資料需手動修正

### Q2：如何新增用戶？

**A**：直接在 Google Sheets 的 `users` 分頁新增一列即可，無需重新部署。

### Q3：忘記管理員密碼怎麼辦？

**A**：直接在 Google Sheets 的 `users` 分頁修改密碼即可。

### Q4：可以自己架設而不使用 Zeabur 嗎？

**A**：可以，只要是支援 Node.js 的環境都能部署（Vercel、Render、Railway、VPS 等）。

### Q5：資料會不會遺失？

**A**：資料儲存在 Google Sheets，只要試算表沒被刪除，資料就永久保存。

### Q6：能不能支援更多股票代號？

**A**：可以，編輯 `stocks.json` 加入新的代號即可。

### Q7：為什麼出現「找不到 transactions 分頁」或「找不到 users 分頁」錯誤？

**A**：Google Sheets 的分頁名稱必須完全一致（區分大小寫）：
- 必須是 `transactions`（全小寫）
- 必須是 `users`（全小寫）
- 不能是 `Transactions`、`transaction`、`交易紀錄` 等其他名稱

檢查分頁名稱是否正確，如有錯誤請重新命名分頁。

## 安全性建議

1. **JWT_SECRET**：使用強隨機字串（建議 32 字元以上）
2. **密碼管理**：
   - 目前密碼以明文儲存在 Google Sheets
   - 建議使用強密碼
   - 未來版本會加入密碼加密功能
3. **Google Sheets 權限**：
   - 只分享給服務帳戶，不要公開分享
   - 定期檢查分享設定
4. **HTTPS**：部署時確保使用 HTTPS（Zeabur 自動提供）

## 授權

MIT License

## 開發者

使用 Claude Code 協助開發
