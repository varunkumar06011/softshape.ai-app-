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
