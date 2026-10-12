import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
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
};

export const visitorAPI = {
  checkIn: (data) => api.post('/visitors/checkin', data),
  checkOut: (id) => api.put(`/visitors/checkout/${id}`),
  scanQR: (qr_data) => api.post('/visitors/scan-qr', { qr_data }),
  getActive: () => api.get('/visits/active'),
  getAll: (params) => api.get('/visits', { params }),
  getById: (id) => api.get(`/visits/${id}`),
};

export const hostAPI = {
  getAll: () => api.get('/hosts'),
  create: (data) => api.post('/hosts', data),
  update: (id, data) => api.put(`/hosts/${id}`, data),
  delete: (id) => api.delete(`/hosts/${id}`),
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

export const reportAPI = {
  exportCSV: (params) => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const query = new URLSearchParams(params).toString();
    window.open(`${baseUrl}/api/reports/csv?${query}`, '_blank');
  },
  exportPDF: (params) => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const query = new URLSearchParams(params).toString();
    window.open(`${baseUrl}/api/reports/pdf?${query}`, '_blank');
  },
  getDepartments: () => api.get('/reports/departments'),
};

export const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('data:') || photoUrl.startsWith('http')) return photoUrl;
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${photoUrl}`;
};

export const otpAPI = {
  send: (phone) => api.post('/otp/send', { phone }),
  verify: (phone, otp) => api.post('/otp/verify', { phone, otp }),
};

export default api;
