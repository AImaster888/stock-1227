// CSV 匯出功能

// 將交易紀錄轉換為 CSV
function toCSV(transactions) {
  if (!transactions || transactions.length === 0) {
    return '無資料';
  }
  
  // CSV 標題
  const headers = ['id', 'user_id', '日期', '代號', '名稱', '類型', '股數', '價格', '總金額', '理由', '屬性', 'created_at'];
  
  // 轉換每筆資料
  const rows = transactions.map(t => {
    return headers.map(h => {
      let value = t[h] || '';
      // 處理包含逗號或換行的欄位
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    }).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

module.exports = {
  toCSV
};
