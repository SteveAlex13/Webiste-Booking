import api from './api';

export const adminService = {
  // Dashboard & Reports
  async getDashboard() {
    return await api.get('/admin/dashboard');
  },

  async getReports(params = {}) {
    return await api.get('/admin/reports', { params });
  },

  // Categories
  async getCategories(params = {}) {
    return await api.get('/admin/categories', { params });
  },

  async createCategory(data) {
    return await api.post('/admin/categories', data);
  },

  async updateCategory(id, data) {
    return await api.put(`/admin/categories/${id}`, data);
  },

  async deleteCategory(id) {
    return await api.delete(`/admin/categories/${id}`);
  },

  // Services
  async getServices(params = {}) {
    return await api.get('/admin/services', { params });
  },

  async createService(formData) {
    return await api.post('/admin/services', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async updateService(id, formData) {
    formData.append('_method', 'PUT');
    return await api.post(`/admin/services/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteService(id) {
    return await api.delete(`/admin/services/${id}`);
  },

  // Schedules & Business Hours
  async getBusinessHours() {
    return await api.get('/admin/business-hours');
  },

  async updateBusinessHours(hours) {
    return await api.post('/admin/business-hours', { hours });
  },

  async getExceptions() {
    return await api.get('/admin/schedule-exceptions');
  },

  async createException(data) {
    return await api.post('/admin/schedule-exceptions', data);
  },

  async deleteException(id) {
    return await api.delete(`/admin/schedule-exceptions/${id}`);
  },

  // Slots
  async getSlots(params = {}) {
    return await api.get('/admin/booking-slots', { params });
  },

  async generateSlots(data) {
    return await api.post('/admin/booking-slots/generate', data);
  },

  // Bookings
  async getBookings(params = {}) {
    return await api.get('/admin/bookings', { params });
  },

  async updateBookingStatus(id, status, reason = '') {
    return await api.patch(`/admin/bookings/${id}/status`, { status, reason });
  },

  // Customers & Payments
  async getCustomers(params = {}) {
    return await api.get('/admin/customers', { params });
  },

  async getPayments(params = {}) {
    return await api.get('/admin/payments', { params });
  },
};

