import api from './api';

export const bookingService = {
  async calculatePrice(data) {
    return await api.post('/bookings/calculate-price', data);
  },

  async createBooking(data) {
    return await api.post('/bookings', data);
  },

  async getMyBookings(page = 1) {
    return await api.get('/bookings', { params: { page } });
  },

  async getBooking(id) {
    return await api.get(`/bookings/${id}`);
  },

  async cancelBooking(id, reason = '') {
    return await api.post(`/bookings/${id}/cancel`, { reason });
  },
};
