import { getToken, type AuthRole } from './auth-storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

async function request(endpoint: string, options: RequestInit = {}, authRole?: AuthRole) {
  const token = getToken(authRole);
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  // Let the browser set multipart boundary for file uploads
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'An error occurred', data.code as string | undefined);
  }

  return data;
}

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  
  getMe: () => request('/auth/me'),

  getMeAs: (role: AuthRole) => request('/auth/me', {}, role),
  
  updateProfile: (data: any) =>
    request('/auth/update-profile', { method: 'PUT', body: JSON.stringify(data) }),
  
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/auth/update-password', { method: 'PUT', body: JSON.stringify(data) }),
  
  configureEmail: (data: { smtpHost: string; smtpPort: number; smtpUser: string; smtpPassword: string }) =>
    request('/auth/configure-email', { method: 'PUT', body: JSON.stringify(data) }),
  
  inviteClient: (data: { name: string; email: string }) =>
    request('/auth/invite-client', { method: 'POST', body: JSON.stringify(data) }),
  
  setPassword: (token: string, password: string) =>
    request(`/auth/set-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) }),
};

// Clients API
export const clientsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/clients${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) => request(`/clients/${id}`),
  
  create: (data: { name: string; email: string; company?: string; phone?: string }) =>
    request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: any) =>
    request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string) => request(`/clients/${id}`, { method: 'DELETE' }),
};

// Projects API
export const projectsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/projects${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) => request(`/projects/${id}`),
  
  create: (data: any) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id: string) => request(`/projects/${id}`, { method: 'DELETE' }),
};

// Milestones API
export const milestonesApi = {
  getAll: (projectId: string) => request(`/projects/${projectId}/milestones`),
  
  create: (projectId: string, data: any) =>
    request(`/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  
  update: (projectId: string, id: string, data: any) =>
    request(`/projects/${projectId}/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  requestChanges: (projectId: string, id: string, message: string) =>
    request(`/projects/${projectId}/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ requestChanges: true, message }),
    }),
  
  delete: (projectId: string, id: string) =>
    request(`/projects/${projectId}/milestones/${id}`, { method: 'DELETE' }),
};

// Feed API
export const feedApi = {
  getMessages: (projectId: string) => request(`/projects/${projectId}/feed`),
  
  createMessage: (projectId: string, formData: FormData) =>
    request(`/projects/${projectId}/feed`, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
};

// Files API
export const filesApi = {
  getAll: (projectId: string) => request(`/projects/${projectId}/files`),
  
  upload: (projectId: string, formData: FormData) =>
    request(`/projects/${projectId}/files`, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
  
  delete: (projectId: string, id: string) =>
    request(`/projects/${projectId}/files/${id}`, { method: 'DELETE' }),
};

// Invoices API
export const invoicesApi = {
  getAll: (params?: { page?: number; limit?: number; project?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/invoices${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) => request(`/invoices/${id}`),
  
  create: (data: any) =>
    request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: any) =>
    request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  send: (id: string) =>
    request(`/invoices/${id}/send`, { method: 'PUT' }),
  
  pay: (id: string) =>
    request(`/invoices/${id}/pay`, { method: 'POST' }),
};

// Proposals API
export const proposalsApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/proposals${query ? `?${query}` : ''}`);
  },
  
  create: (data: any) =>
    request('/proposals', { method: 'POST', body: JSON.stringify(data) }),
  
  getPublic: (slug: string) => request(`/proposals/public/${slug}`),
  
  accept: (id: string, slug?: string) =>
    request(`/proposals/${id}/accept${slug ? `?slug=${slug}` : ''}`, { method: 'PUT' }),
  
  reject: (id: string, slug?: string) =>
    request(`/proposals/${id}/reject${slug ? `?slug=${slug}` : ''}`, { method: 'PUT' }),
  
  delete: (id: string) =>
    request(`/proposals/${id}`, { method: 'DELETE' }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/notifications${query ? `?${query}` : ''}`);
  },
  
  markAllRead: () => request('/notifications/mark-all-read', { method: 'PUT' }),
  
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
};

// Subscription API
export const subscriptionApi = {
  startTrial: () =>
    request('/subscriptions/start-trial', { method: 'POST' }, 'freelancer'),

  createCheckout: () =>
    request('/subscriptions/checkout', { method: 'POST' }, 'freelancer'),

  confirmCheckout: (sessionId: string) =>
    request('/subscriptions/confirm', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }, 'freelancer'),

  getStatus: () =>
    request('/subscriptions/status', {}, 'freelancer'),
};

// Contact API
export const contactApi = {
  submitSales: (data: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    phone?: string;
    teamSize?: string;
    message?: string;
    interestedIn?: string;
  }) => request('/contact/sales', { method: 'POST', body: JSON.stringify(data) }),
};

export { ApiError };
