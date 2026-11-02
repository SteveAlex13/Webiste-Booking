import api from './api';

export const paymentService = {
  async checkout(bookingId) {
    return await api.post('/payments/checkout', { booking_id: bookingId });
  },

  async getPayment(id) {
    return await api.get(`/payments/${id}`);
  },

  async checkStatus(id) {
    return await api.get(`/payments/${id}/status`);
  },
};

