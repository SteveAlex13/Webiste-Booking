import api from './api';

export const serviceService = {
  async getCategories() {
    return await api.get('/categories');
  },

  async getServices(params = {}) {
    return await api.get('/services', { params });
  },

  async getService(idOrSlug) {
    return await api.get(`/services/${idOrSlug}`);
  },

  async getAvailability(serviceId, date) {
    return await api.get(`/services/${serviceId}/availability`, {
      params: { date },
    });
  },
};

