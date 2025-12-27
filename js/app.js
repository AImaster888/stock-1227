// ===== 共用函式 =====

function checkAuth(requireAdmin = false) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) { window.location.href = '/'; return; }
  if (requireAdmin && user.role !== 'admin') { alert('需要管理員權限'); window.location.href = '/dashboard'; return; }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers }
  });
  if (res.status === 401) { logout(); throw new Error('認證失敗'); }
  return res.json();
}

async function lookupStock(code, targetElementId) {
  const targetEl = document.getElementById(targetElementId);
  if (!code || code.length < 2) { targetEl.textContent = ''; return; }
  try {
    const res = await fetch(`/api/stock/${code}`);
    const data = await res.json();
    targetEl.textContent = data.name || '(查無此代號)';
  } catch (error) { targetEl.textContent = ''; }
}

async function loadTransactions() {
  const startDate = document.getElementById('filterStartDate')?.value || '';
  const endDate = document.getElementById('filterEndDate')?.value || '';
  const stockCode = document.getElementById('filterStockCode')?.value || '';
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (stockCode) params.append('stockCode', stockCode);
  try {
    const transactions = await fetchWithAuth(`/api/transactions?${params}`);
    renderTransactions(transactions);
  } catch (error) { console.error('載入失敗:', error); }
}

function renderTransactions(transactions) {
  const tbody = document.getElementById('transactionsBody');
  const emptyState = document.getElementById('emptyState');
  if (!transactions || transactions.length === 0) { tbody.innerHTML = ''; emptyState.style.display = 'block'; return; }
  emptyState.style.display = 'none';
  tbody.innerHTML = '';
  transactions.forEach(t => {
    const typeClass = t.類型 === 'buy' ? 'type-buy' : 'type-sell';
    const typeText = t.類型 === 'buy' ? '買入' : '賣出';
    tbody.innerHTML += `<tr><td>${t.日期}</td><td>${t.代號}</td><td>${t.名稱}</td><td class="${typeClass}">${typeText}</td><td>${parseInt(t.股數).toLocaleString()}</td><td>${parseFloat(t.價格).toLocaleString()}</td><td>${parseFloat(t.總金額).toLocaleString()}</td><td>${t.屬性 || '-'}</td><td class="actions"><button class="btn btn-primary" onclick="openEditModal('${t.id}')">編輯</button><button class="btn btn-danger" onclick="deleteTransaction('${t.id}')">刪除</button></td></tr>`;
  });
  window.transactionsData = transactions;
}

function clearFilters() {
  document.getElementById('filterStartDate').value = '';
  document.getElementById('filterEndDate').value = '';
  document.getElementById('filterStockCode').value = '';
  loadTransactions();
}

function openEditModal(id) {
  const t = window.transactionsData.find(x => x.id === id);
  if (!t) return;
  document.getElementById('editId').value = t.id;
  document.getElementById('editDate').value = t.日期;
  document.getElementById('editStockCode').value = t.代號;
  document.getElementById('editStockName').textContent = t.名稱;
  document.getElementById('editType').value = t.類型;
  document.getElementById('editQuantity').value = t.股數;
  document.getElementById('editPrice').value = t.價格;
  document.getElementById('editReason').value = t.理由 || '';
  document.getElementById('editAttribute').value = t.屬性 || '';
  document.getElementById('editModal').classList.add('show');
}

function closeEditModal() { document.getElementById('editModal').classList.remove('show'); }

async function deleteTransaction(id) {
  if (!confirm('確定要刪除此筆紀錄嗎？')) return;
  try {
    const res = await fetchWithAuth(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.success) { alert('刪除成功'); loadTransactions(); }
    else { alert('刪除失敗：' + res.message); }
  } catch (error) { alert('刪除失敗：' + error.message); }
}

function exportCSV() {
  const token = localStorage.getItem('token');
  window.location.href = `/api/export/csv?token=${token}`;
}
