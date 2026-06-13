// SaaS backend — separate from restaurant operations backend
const SAAS_API = import.meta.env.VITE_SAAS_API_URL || 'http://localhost:4000';

const h = { 'Content-Type': 'application/json' };

function authHeader() {
  const token = localStorage.getItem('saas_token');
  return token ? { ...h, Authorization: `Bearer ${token}` } : h;
}

export async function registerOwner(data) {
  const res = await fetch(`${SAAS_API}/api/auth/register`, { method: 'POST', headers: h, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Registration failed');
  if (json.token) {
    localStorage.setItem('saas_token', json.token);
    if (json.owner) localStorage.setItem('saas_owner', JSON.stringify(json.owner));
  }
  return json;
}

export async function loginOwner(email, password) {
  const res = await fetch(`${SAAS_API}/api/auth/login`, { method: 'POST', headers: h, body: JSON.stringify({ email, password }) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  localStorage.setItem('saas_token', json.token);
  localStorage.setItem('saas_owner', JSON.stringify(json.owner));
  return json;
}

export function getOwner() {
  try { return JSON.parse(localStorage.getItem('saas_owner')); } catch { return null; }
}

export function logoutOwner() {
  localStorage.removeItem('saas_token');
  localStorage.removeItem('saas_owner');
  localStorage.removeItem('saas_onboarding');
}

export async function saveOnboardingStep(step, data) {
  const current = JSON.parse(localStorage.getItem('saas_onboarding') || '{}');
  const updated = { ...current, [step]: data };
  localStorage.setItem('saas_onboarding', JSON.stringify(updated));
  return updated;
}

export function getOnboardingData() {
  try { return JSON.parse(localStorage.getItem('saas_onboarding') || '{}'); } catch { return {}; }
}

export async function createRazorpayOrder(planId) {
  const res = await fetch(`${SAAS_API}/api/payment/create-order`, {
    method: 'POST', headers: authHeader(), body: JSON.stringify({ planId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Payment init failed');
  return json;
}

export async function verifyPayment(payload) {
  const res = await fetch(`${SAAS_API}/api/payment/verify`, {
    method: 'POST', headers: authHeader(), body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Payment verification failed');
  return json;
}

export async function uploadMenuCSV(restaurantId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('restaurantId', restaurantId);
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${SAAS_API}/api/menu/upload-csv`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json;
}

export async function getTenantBySlug(slug) {
  const res = await fetch(`${SAAS_API}/api/tenant/${slug}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Tenant not found');
  return json;
}

export async function tenantLogin(slug, role, username, password, stationId = null) {
  const res = await fetch(`${SAAS_API}/api/tenant/${slug}/login`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ role, username, password, stationId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Invalid credentials');
  localStorage.setItem(`tenant_${slug}_token`, json.token);
  localStorage.setItem(`tenant_${slug}_session`, JSON.stringify(json.session));
  return json;
}

// ── Tenant auth helper ──
function tenantAuthHeader(slug) {
  const token = localStorage.getItem(`tenant_${slug}_token`);
  return token ? { ...h, Authorization: `Bearer ${token}` } : h;
}

// ── Orders ──
export async function getActiveOrders(restaurantId, slug) {
  const res = await fetch(`${SAAS_API}/api/orders/${restaurantId}/active`, { headers: tenantAuthHeader(slug) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch orders');
  return json;
}

export async function createOrder(orderData, slug) {
  const res = await fetch(`${SAAS_API}/api/orders`, { method: 'POST', headers: tenantAuthHeader(slug), body: JSON.stringify(orderData) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create order');
  return json;
}

export async function addItemsToOrder(orderId, items, slug) {
  const res = await fetch(`${SAAS_API}/api/orders/${orderId}/add-items`, { method: 'POST', headers: tenantAuthHeader(slug), body: JSON.stringify({ items }) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to add items');
  return json;
}

export async function sendKOT(orderId, itemIds, slug) {
  const res = await fetch(`${SAAS_API}/api/orders/${orderId}/send-kot`, { method: 'POST', headers: tenantAuthHeader(slug), body: JSON.stringify({ itemIds }) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to send KOT');
  return json;
}

export async function printBillAPI(orderId, slug) {
  const res = await fetch(`${SAAS_API}/api/orders/${orderId}/print-bill`, { method: 'POST', headers: tenantAuthHeader(slug) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to print bill');
  return json;
}

export async function duplicateOrder(orderId, slug) {
  const res = await fetch(`${SAAS_API}/api/orders/${orderId}/duplicate`, { method: 'POST', headers: tenantAuthHeader(slug) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to duplicate order');
  return json;
}

export async function settleOrder(orderId, paymentMode, slug) {
  const res = await fetch(`${SAAS_API}/api/orders/${orderId}/settle`, { method: 'POST', headers: tenantAuthHeader(slug), body: JSON.stringify({ paymentMode }) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to settle order');
  return json;
}

// ── Online Orders ──
export async function getOnlineOrders(restaurantId) {
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${SAAS_API}/api/urbanpiper/orders/${restaurantId}`, { headers: token ? { Authorization: `Bearer ${token}` } : h });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch online orders');
  return json;
}

export async function updateOnlineOrderStatus(orderId, status) {
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${SAAS_API}/api/urbanpiper/orders/${orderId}/status`, { method: 'PATCH', headers: token ? { ...h, Authorization: `Bearer ${token}` } : h, body: JSON.stringify({ status }) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update order');
  return json;
}

// ── Reports ──
export async function getReportSummary(restaurantId, from, to) {
  const qs = from && to ? `?from=${from}&to=${to}` : '';
  const res = await fetch(`${SAAS_API}/api/reports/summary${qs}`, { headers: tenantAuthHeader(restaurantId) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch summary');
  return json;
}

export async function getDailyReport(restaurantId, from, to) {
  const qs = from && to ? `?from=${from}&to=${to}` : '';
  const res = await fetch(`${SAAS_API}/api/reports/daily${qs}`, { headers: tenantAuthHeader(restaurantId) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch daily report');
  return json;
}

export async function getChannelBreakdown(restaurantId, from, to) {
  const qs = from && to ? `?from=${from}&to=${to}` : '';
  const res = await fetch(`${SAAS_API}/api/reports/channel-breakdown${qs}`, { headers: tenantAuthHeader(restaurantId) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch channel breakdown');
  return json;
}

// ── Admin ──
export async function getAdminTransactions(restaurantId, slug, filters = {}) {
  const params = new URLSearchParams({ restaurantId, ...filters });
  const res = await fetch(`${SAAS_API}/api/admin/transactions?${params}`, { headers: tenantAuthHeader(slug) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch transactions');
  return json;
}

export async function deleteTransaction(orderId, reason, slug) {
  const res = await fetch(`${SAAS_API}/api/admin/transactions/${orderId}`, { method: 'DELETE', headers: tenantAuthHeader(slug), body: JSON.stringify({ reason }) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete transaction');
  return json;
}

// ── Menu Management ──
export async function getMenuItems(restaurantId, type = 'BOTH') {
  const res = await fetch(`${SAAS_API}/api/menu/${restaurantId}?type=${type}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch menu');
  return json;
}

export async function getTodaysSpecials(restaurantId) {
  const res = await fetch(`${SAAS_API}/api/menu/${restaurantId}/specials`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch specials');
  return json;
}

export async function addMenuItem(data) {
  const res = await fetch(`${SAAS_API}/api/menu/item`, { method: 'POST', headers: authHeader(), body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to add item');
  return json;
}

export async function updateMenuItem(id, data) {
  const res = await fetch(`${SAAS_API}/api/menu/item/${id}`, { method: 'PATCH', headers: authHeader(), body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update item');
  return json;
}

export async function deleteMenuItem(id) {
  const res = await fetch(`${SAAS_API}/api/menu/item/${id}`, { method: 'DELETE', headers: authHeader() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete item');
  return json;
}

export async function uploadMenuItemImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${SAAS_API}/api/menu/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json;
}

// ── Swap / Merge ──
export async function swapTable(orderId, newTableId, newTableName, newSection) {
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${SAAS_API}/api/orders/${orderId}/swap-table`, {
    method: 'POST',
    headers: token ? { ...h, Authorization: `Bearer ${token}` } : h,
    body: JSON.stringify({ newTableId, newTableName, newSection }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Swap failed');
  return json;
}

export async function swapItems(orderId, targetOrderId, itemIds) {
  const res = await fetch(`${SAAS_API}/api/orders/${orderId}/swap-items`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ targetOrderId, itemIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Move items failed');
  return json;
}

export async function mergeOrders(sourceOrderId, targetOrderId) {
  const res = await fetch(`${SAAS_API}/api/orders/merge`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ sourceOrderId, targetOrderId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Merge failed');
  return json;
}

// ── AI Menu ──
export async function suggestMenuItems(items) {
  const res = await fetch(`${SAAS_API}/api/ai-menu/suggest`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ items }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'AI suggestion failed');
  return json;
}

export async function suggestFromCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${SAAS_API}/api/ai-menu/suggest-from-csv`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'AI CSV suggestion failed');
  return json;
}

// ── Marketing AI ──
export async function analyzeMenuImage(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${SAAS_API}/api/marketing/analyze-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Analysis failed');
  return json;
}
