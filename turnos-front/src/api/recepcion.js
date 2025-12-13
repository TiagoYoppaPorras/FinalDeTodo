// src/api/recepcion.js
import api from "./Client";

export const recepcionApi = {
  // Listar todos los turnos
  getAllAppointments() {
    return api.get("/recepcion/turnos");
  },

  // Confirmar o cancelar turno
  updateAppointmentStatus(turnoId, data) {
    // data = { estado: "confirmado" | "cancelado", nota?: string }
    return api.put(`/recepcion/turnos/${turnoId}/estado`, data);
  },
};
