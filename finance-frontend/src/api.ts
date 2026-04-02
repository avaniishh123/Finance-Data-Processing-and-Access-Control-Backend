const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function headers() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request('POST', '/auth/login', { email, password }),

  // Records
  getRecords: (params = '') => request('GET', `/records${params}`),
  createRecord: (body: unknown) => request('POST', '/records', body),
  updateRecord: (id: number, body: unknown) => request('PATCH', `/records/${id}`, body),
  deleteRecord: (id: number) => request('DELETE', `/records/${id}`),

  // Dashboard
  getSummary: () => request('GET', '/dashboard/summary'),
  getByCategory: () => request('GET', '/dashboard/by-category'),
  getTrends: (period = 'monthly') => request('GET', `/dashboard/trends?period=${period}`),
  getRecent: () => request('GET', '/dashboard/recent?limit=5'),

  // Users
  getUsers: () => request('GET', '/users'),
  createUser: (body: unknown) => request('POST', '/users', body),
  updateUser: (id: number, body: unknown) => request('PATCH', `/users/${id}`, body),
  deleteUser: (id: number) => request('DELETE', `/users/${id}`),
};
