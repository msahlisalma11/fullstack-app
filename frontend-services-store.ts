// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH SERVICES
// ============================================================================

export const authService = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'consumer' | 'merchant';
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),

  requestPasswordReset: (email: string) =>
    api.post('/auth/request-password-reset', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// ============================================================================
// BASKET SERVICES
// ============================================================================

export const basketService = {
  getAll: (params?: any) => api.get('/baskets', { params }),

  getById: (id: string) => api.get(`/baskets/${id}`),

  search: (query: string, params?: any) =>
    api.get('/baskets/search', { params: { q: query, ...params } }),

  getNearby: (latitude: number, longitude: number, radiusKm: number = 5) =>
    api.get('/baskets/nearby', {
      params: { latitude, longitude, radiusKm },
    }),

  getByMerchant: (merchantId: string) =>
    api.get(`/merchants/${merchantId}/baskets`),

  create: (data: any) => api.post('/baskets', data),

  update: (id: string, data: any) => api.put(`/baskets/${id}`, data),

  delete: (id: string) => api.delete(`/baskets/${id}`),

  addToFavorites: (basketId: string) =>
    api.post(`/baskets/${basketId}/favorite`),

  removeFromFavorites: (basketId: string) =>
    api.delete(`/baskets/${basketId}/favorite`),

  getFavorites: () => api.get('/baskets/favorites'),
};

// ============================================================================
// RESERVATION SERVICES
// ============================================================================

export const reservationService = {
  create: (data: {
    basketId: string;
    quantity: number;
    pickupDate: string;
  }) => api.post('/reservations', data),

  getAll: (params?: any) => api.get('/reservations', { params }),

  getById: (id: string) => api.get(`/reservations/${id}`),

  update: (id: string, data: any) => api.put(`/reservations/${id}`, data),

  cancel: (id: string, reason?: string) =>
    api.post(`/reservations/${id}/cancel`, { reason }),

  confirm: (id: string) => api.post(`/reservations/${id}/confirm`),

  getQRCode: (id: string) => api.get(`/reservations/${id}/qr-code`),

  markAsCollected: (id: string) =>
    api.post(`/reservations/${id}/mark-collected`),
};

// ============================================================================
// PAYMENT SERVICES
// ============================================================================

export const paymentService = {
  createPaymentIntent: (reservationId: string) =>
    api.post('/payments/create-intent', { reservationId }),

  confirmPayment: (paymentIntentId: string) =>
    api.post('/payments/confirm', { paymentIntentId }),

  getPaymentHistory: (params?: any) =>
    api.get('/payments/history', { params }),

  getReceipt: (paymentId: string) =>
    api.get(`/payments/${paymentId}/receipt`),
};

// ============================================================================
// USER SERVICES
// ============================================================================

export const userService = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: any) => api.put('/users/profile', data),

  updatePreferences: (data: any) => api.put('/users/preferences', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/users/change-password', { currentPassword, newPassword }),

  getNotifications: (params?: any) =>
    api.get('/notifications', { params }),

  markNotificationAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),

  markAllNotificationsAsRead: () =>
    api.put('/notifications/read-all'),
};

// ============================================================================
// MERCHANT SERVICES
// ============================================================================

export const merchantService = {
  getProfile: () => api.get('/merchants/profile'),

  updateProfile: (data: any) => api.put('/merchants/profile', data),

  getDashboard: () => api.get('/merchants/dashboard'),

  getStats: (params?: any) => api.get('/merchants/stats', { params }),

  getOrders: (params?: any) => api.get('/merchants/orders', { params }),

  getReviews: (params?: any) => api.get('/merchants/reviews', { params }),

  createBasket: (data: any) => api.post('/merchants/baskets', data),

  updateBasket: (basketId: string, data: any) =>
    api.put(`/merchants/baskets/${basketId}`, data),

  deleteBasket: (basketId: string) =>
    api.delete(`/merchants/baskets/${basketId}`),
};

// ============================================================================
// REVIEW SERVICES
// ============================================================================

export const reviewService = {
  create: (data: {
    basketId: string;
    merchantId: string;
    rating: number;
    comment: string;
    images?: File[];
  }) => {
    const formData = new FormData();
    formData.append('basketId', data.basketId);
    formData.append('merchantId', data.merchantId);
    formData.append('rating', data.rating.toString());
    formData.append('comment', data.comment);
    if (data.images) {
      data.images.forEach((img, idx) => formData.append(`images[${idx}]`, img));
    }
    return api.post('/reviews', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getByBasket: (basketId: string, params?: any) =>
    api.get(`/baskets/${basketId}/reviews`, { params }),

  getByMerchant: (merchantId: string, params?: any) =>
    api.get(`/merchants/${merchantId}/reviews`, { params }),

  markHelpful: (reviewId: string) =>
    api.post(`/reviews/${reviewId}/helpful`),

  markUnhelpful: (reviewId: string) =>
    api.post(`/reviews/${reviewId}/unhelpful`),
};

export default api;

// ============================================================================
// src/store/authStore.ts - Zustand State Management
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'consumer' | 'merchant' | 'admin';
  avatarUrl?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          const { user, accessToken, refreshToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(data);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.updateProfile(data);
          set({ user: response.data.user, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Update failed',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
