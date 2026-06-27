import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const platformApi = {
  listOrgs: () => api.get('/platform/orgs'),
  createOrg: (data) => api.post('/platform/orgs', data),
  getOrg: (orgId) => api.get(`/platform/orgs/${orgId}`),
  orgAnalytics: (orgId, params) => api.get(`/platform/orgs/${orgId}/analytics`, { params }),
  createUnit: (orgId, data) => api.post(`/platform/orgs/${orgId}/units`, data),
  updateUnit: (orgId, unitId, data) => api.patch(`/platform/orgs/${orgId}/units/${unitId}`, data),
};

export const orgApi = {
  members: (orgId) => api.get(`/orgs/${orgId}/members`),
  createMember: (orgId, data) => api.post(`/orgs/${orgId}/members`, data),
  creatableRoles: (orgId) => api.get(`/orgs/${orgId}/creatable-roles`),
};

export const classroomApi = {
  list: () => api.get('/classrooms'),
  get: (id) => api.get(`/classrooms/${id}`),
  create: (data) => api.post('/classrooms', data),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  remove: (id) => api.delete(`/classrooms/${id}`),
  sync: (id) => api.post(`/classrooms/${id}/sync`, {}, { timeout: 600000 }),
  syncBatch: (id, data) => api.post(`/classrooms/${id}/sync-batch`, data, { timeout: 300000 }),
  syncComplete: (id) => api.post(`/classrooms/${id}/sync-complete`),
  teacherDashboard: (id, divisionId) =>
    api.get(`/classrooms/${id}/teacher-dashboard`, {
      params: divisionId ? { divisionId } : {},
    }),
  studentFilters: (id, body) => api.post(`/classrooms/${id}/student-filters`, body),
};

export const divisionApi = {
  list: (classroomId) => api.get(`/divisions/${classroomId}`),
  create: (classroomId, data) => api.post(`/divisions/${classroomId}`, data),
  update: (classroomId, id, data) => api.put(`/divisions/${classroomId}/${id}`, data),
  remove: (classroomId, id) => api.delete(`/divisions/${classroomId}/${id}`),
};

export const studentApi = {
  list: (classroomId, params) => api.get(`/students/${classroomId}`, { params }),
  create: (classroomId, data) => api.post(`/students/${classroomId}`, data),
  bulk: (classroomId, data) => api.post(`/students/${classroomId}/bulk`, data),
  approve: (classroomId, id, action) =>
    api.patch(`/students/${classroomId}/${id}/approve`, { action }),
  update: (classroomId, id, data) => api.put(`/students/${classroomId}/${id}`, data),
  remove: (classroomId, id) => api.delete(`/students/${classroomId}/${id}`),
  syncOne: (classroomId, studentId) => api.post(`/students/${classroomId}/${studentId}/sync`),
};

export const publicApi = {
  classroom: (slug) => api.get(`/public/classrooms/${slug}`),
  analytics: (slug, division) =>
    api.get(`/public/classrooms/${slug}/analytics`, { params: division ? { division } : {} }),
  division: (slug, divSlug) => api.get(`/public/classrooms/${slug}/divisions/${divSlug}`),
  student: (slug, studentId) => api.get(`/public/classrooms/${slug}/students/${studentId}`),
  studentComparison: (slug, studentId) =>
    api.get(`/public/classrooms/${slug}/students/${studentId}/comparison`),
  studentPeers: (slug, studentId) =>
    api.get(`/public/classrooms/${slug}/students/${studentId}/peers`),
  compareStudents: (slug, studentId, peerId) =>
    api.get(`/public/classrooms/${slug}/students/${studentId}/compare/${peerId}`),
  join: (slug, data) => api.post(`/public/classrooms/${slug}/join`, data),
};

export default api;
