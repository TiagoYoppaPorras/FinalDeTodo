// src/api/kines.js
import api from "./Client";

export const kinesApi = {
  // 🔹 Listar turnos del kinesiólogo autenticado
  getMyAppointments() {
    return api.get("/kines/turnos");
  },

  // 🔹 Obtener métricas para el dashboard
  getDashboardData() {
    return api.get("/kines/dashboard");
  },

  // 🔹 Actualizar estado o nota del turno
  updateTurno(turnoId, payload) {
    return api.put(`/kines/turnos/${turnoId}`, payload);
  },
};
