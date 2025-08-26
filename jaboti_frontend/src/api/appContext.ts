// Simple app context to hold active user and company across the app and API calls
// Persisted in localStorage to survive hard refresh

let activeUserId: string | number | null = null;
let activeCompanyId: number | null = null;

// Initialize from localStorage
try {
  const uid = localStorage.getItem('activeUserId');
  const cid = localStorage.getItem('activeCompanyId');
  activeUserId = uid ? (isNaN(Number(uid)) ? uid : Number(uid)) : null;
  activeCompanyId = cid ? Number(cid) : null;
} catch {
  // storage not available
}

export function setActiveUser(userId: string | number | null) {
  activeUserId = userId;
  try {
    if (userId === null || userId === undefined) localStorage.removeItem('activeUserId');
    else localStorage.setItem('activeUserId', String(userId));
  } catch {}
}

export function setActiveCompany(companyId: number | string | null) {
  if (companyId === null || companyId === undefined || companyId === '') {
    activeCompanyId = null;
  } else {
    const num = typeof companyId === 'string' ? Number(companyId) : companyId;
    activeCompanyId = Number.isNaN(num as number) ? null : (num as number);
  }
  try {
    if (activeCompanyId == null) localStorage.removeItem('activeCompanyId');
    else localStorage.setItem('activeCompanyId', String(activeCompanyId));
  } catch {}
}

export function getActiveUserId() { return activeUserId; }
export function getActiveCompanyId() { return activeCompanyId; }

export function clearAppContext() {
  activeUserId = null;
  activeCompanyId = null;
  try { localStorage.removeItem('activeUserId'); localStorage.removeItem('activeCompanyId'); } catch {}
}
