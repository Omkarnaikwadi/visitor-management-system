import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  selfRegister: (data) => api.post('/auth/register/self', data),
  profile: () => api.get('/auth/profile'),
  saveFcmToken: (fcm_token) => api.post('/auth/fcm-token', { fcm_token }),
};

export const visitorAPI = {
  checkIn: (data) => api.post('/visitors/checkin', data),
  checkOut: (id) => api.put(`/visitors/checkout/${id}`),
  scanQR: (qr_data) => api.post('/visitors/scan-qr', { qr_data }),
  checkReturning: (email) => api.get('/visitors/returning', { params: { email } }),
  getActive: () => api.get('/visits/active'),
  getAll: (params) => api.get('/visits', { params }),
  getById: (id) => api.get(`/visits/${id}`),
};

export const receptionistAPI = {
  getAll: () => api.get('/receptionists'),
  create: (data) => api.post('/auth/register', data),
  toggleActive: (id) => api.patch(`/receptionists/${id}/toggle`),
  resetPassword: (id, password) => api.patch(`/receptionists/${id}/reset-password`, { password }),
};

export const hostAPI = {
  getAll: () => api.get('/hosts'),
  create: (data) => api.post('/hosts', data),
  update: (id, data) => api.put(`/hosts/${id}`, data),
  delete: (id) => api.delete(`/hosts/${id}`),
  saveFcmToken: (id, fcm_token) => api.post(`/hosts/${id}/fcm-token`, { fcm_token }),
};

export const preRegAPI = {
  create: (data) => api.post('/pre-registrations', data),
  getAll: () => api.get('/pre-registrations'),
  getByPhone: (phone) => api.get(`/pre-registrations/phone/${phone}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecent: () => api.get('/dashboard/recent'),
  getByDepartment: () => api.get('/dashboard/by-department'),
  getTrend: () => api.get('/dashboard/trend'),
};

const downloadBlob = async (url, params, filename) => {
  const res = await api.get(url, { params, responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
};

export const reportAPI = {
  exportCSV: (params) => downloadBlob('/reports/csv', params, `visits_report_${Date.now()}.csv`),
  exportPDF: (params) => downloadBlob('/reports/pdf', params, `visits_report_${Date.now()}.pdf`),
  getDepartments: () => api.get('/reports/departments'),
};

export const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('data:') || photoUrl.startsWith('http')) return photoUrl;
  // legacy: relative path from old disk storage
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${photoUrl}`;
};

export const otpAPI = {
  send: (email) => api.post('/otp/send', { email }),
  verify: (email, otp) => api.post('/otp/verify', { email, otp }),
};

export default api;
