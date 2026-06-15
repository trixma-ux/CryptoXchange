import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (totpCode: string) => api.post('/auth/2fa/enable', { totpCode }),
  disable2FA: (data: any) => api.post('/auth/2fa/disable', data),
};

// Users APIs
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  changePassword: (data: any) => api.post('/users/change-password', data),
  getMobileMoneyAccounts: () => api.get('/users/mobile-money-accounts'),
  addMobileMoneyAccount: (data: any) => api.post('/users/mobile-money-accounts', data),
  getBankAccounts: () => api.get('/users/bank-accounts'),
  addBankAccount: (data: any) => api.post('/users/bank-accounts', data),
};

// Wallets APIs
export const walletsAPI = {
  getWallets: () => api.get('/wallets'),
  getPortfolio: () => api.get('/wallets/portfolio'),
  getWallet: (currency: string) => api.get(`/wallets/${currency}`),
  getQRCode: (currency: string) => api.get(`/wallets/${currency}/qrcode`),
};

// Trading APIs
export const tradingAPI = {
  getQuote: (params: any) => api.get('/trading/quote', { params }),
  buy: (data: any) => api.post('/trading/buy', data),
  sell: (data: any) => api.post('/trading/sell', data),
  getHistory: (params?: any) => api.get('/trading/history', { params }),
};

// Swap APIs
export const swapAPI = {
  getQuote: (params: any) => api.get('/swap/quote', { params }),
  execute: (data: any) => api.post('/swap', data),
  getHistory: (params?: any) => api.get('/swap/history', { params }),
};

// Transactions APIs
export const transactionsAPI = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getOne: (id: string) => api.get(`/transactions/${id}`),
  cryptoDeposit: (data: any) => api.post('/transactions/deposit/crypto', data),
  cryptoWithdrawal: (data: any) => api.post('/transactions/withdraw/crypto', data),
};

// Payments APIs
export const paymentsAPI = {
  mobileMoneyDeposit: (data: any) => api.post('/payments/mobile-money/deposit', data),
  mobileMoneyWithdrawal: (data: any) => api.post('/payments/mobile-money/withdrawal', data),
};

// KYC APIs
export const kycAPI = {
  getStatus: () => api.get('/kyc/status'),
  uploadDocument: (formData: FormData) => api.post('/kyc/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Prices APIs
export const pricesAPI = {
  getPrices: () => api.get('/prices'),
  getChart: (currency: string, days?: number) => api.get(`/prices/chart/${currency}`, { params: { days } }),
};

// Notifications APIs
export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

// Support APIs
export const supportAPI = {
  getTickets: () => api.get('/support'),
  createTicket: (data: any) => api.post('/support', data),
  getTicket: (id: string) => api.get(`/support/${id}`),
  reply: (id: string, message: string) => api.post(`/support/${id}/reply`, { message }),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserStatus: (userId: string, status: string) => api.patch(`/admin/users/${userId}/status`, { status }),
  getKycRequests: (params?: any) => api.get('/admin/kyc', { params }),
  reviewKyc: (documentId: string, data: any) => api.patch(`/admin/kyc/${documentId}/review`, data),
  getTransactions: (params?: any) => api.get('/admin/transactions', { params }),
  reviewWithdrawal: (txId: string, data: any) => api.patch(`/admin/transactions/${txId}/review`, data),
  getFees: () => api.get('/admin/fees'),
  updateFee: (data: any) => api.post('/admin/fees', data),
  getTickets: (params?: any) => api.get('/admin/support/tickets', { params }),
  replyTicket: (id: string, message: string) => api.post(`/admin/support/tickets/${id}/reply`, { message }),
};
