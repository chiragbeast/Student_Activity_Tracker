import api from '../api'

export const deadlineApi = {
  getDeadlines: () => api.get('/deadlines'),
  createDeadline: (data) => api.post('/deadlines', data),
  deleteDeadline: (id) => api.delete(`/deadlines/${id}`),
}

export const facultyApi = {
  getStudents: () => api.get('/faculty/students'),
  getPendingSubmissions: () => api.get('/faculty/submissions/pending'),
  getSubmissionDetails: (id) => api.get(`/faculty/submissions/${id}`),
  reviewSubmission: (id, data) => api.post(`/faculty/submissions/${id}/review`, data),
  bulkReviewSubmissions: (data) => api.post('/faculty/submissions/bulk-review', data),
  getStats: () => api.get('/faculty/stats'),
  getProfile: () => api.get('/faculty/profile'),
  updateProfile: (data) => api.put('/faculty/profile', data),
  updateProfilePicture: (formData) =>
    api.put('/faculty/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  exportCSV: () => api.get('/faculty/export', { responseType: 'blob' }),
  getStudentHistory: (studentId) => api.get(`/faculty/students/${studentId}/submissions`),
  exportPDF: (studentId) =>
    api.get(`/faculty/students/${studentId}/export-pdf`, { responseType: 'blob' }),
  exportAllPDFs: () => api.get('/faculty/students/export-all-pdf', { responseType: 'blob' }),
  notifyEmail: (studentId, reason) =>
    api.post(`/faculty/students/${studentId}/notify-email`, { reason }),
}

export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
}
