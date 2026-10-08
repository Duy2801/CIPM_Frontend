import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

export interface ApiResponse<T = unknown> {
  status: boolean;
  statusCode: number;
  data: T;
  message?: string;
  meta?: unknown;
}

export interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  <T = unknown, R = ApiResponse<T>, D = unknown>(config: AxiosRequestConfig<D>): Promise<R>;
  <T = unknown, R = ApiResponse<T>, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;

  get<T = unknown, R = ApiResponse<T>, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = unknown, R = ApiResponse<T>, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = unknown, R = ApiResponse<T>, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = unknown, R = ApiResponse<T>, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = unknown, R = ApiResponse<T>, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
}

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/`,
  timeout: 10000, // 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
}) as CustomAxiosInstance;

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const userInfoStr = Cookies.get('user_info');
      if (userInfoStr && config.headers) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          if (userInfo.branchId) {
            config.headers['x-branch-id'] = userInfo.branchId;
          }
        } catch {}
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

          if (typeof window === 'undefined' || originalRequest.url === '/auth/refresh' || originalRequest._retry) {
            if (typeof window !== 'undefined') {
              Cookies.remove('access_token');
              Cookies.remove('refresh_token');
              Cookies.remove('user_info');
              if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/login') {
                window.location.href = '/auth/login';
              }
            }
            return Promise.reject(error);
          }

          if (isRefreshing) {
            return new Promise(function(resolve, reject) {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              return apiClient(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = Cookies.get('refresh_token');
            if (!refreshToken) {
               throw new Error('No refresh token available');
            }

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/admin/auth/refresh`, {}, {
              headers: { Authorization: `Bearer ${refreshToken}` }
            });

            const { accessToken, refreshToken: newRefreshToken } = res.data;
            Cookies.set('access_token', accessToken);
            Cookies.set('refresh_token', newRefreshToken);
            
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            processQueue(null, accessToken);
            return apiClient(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            Cookies.remove('user_info');
            if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/login') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        case 403:
          console.error('Forbidden: Bạn không có quyền truy cập.');
          break;
        case 404:
          console.error('Not Found: Không tìm thấy tài nguyên.');
          break;
        case 500:
          console.error('Server Error: Có lỗi từ phía máy chủ.');
          break;
        default:
          console.error('API Error:', error.message);
      }
    } else if (error.request) {
      console.error('Network Error: Không thể kết nối tới server.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
