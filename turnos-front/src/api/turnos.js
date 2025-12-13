import { turnosApi } from './apiService';

// Métodos específicos de turnos que no están en el ApiService genérico
export const turnosService = {
    ...turnosApi,
    
    // Métodos CRUD básicos heredados de ApiService:
    // - getAll(params)
    // - getById(id)
    // - create(data)
    // - update(id, data)
    // - delete(id)
    
    /**
     * Obtener turnos próximos (7 días)
     * @returns {Promise<Array>}
     */
    async getProximos() {
        try {
            const response = await turnosApi.getAll({ proximos: true });
            return response;
        } catch (error) {
            console.error('Error obteniendo turnos próximos:', error);
            throw error;
        }
    },
    
    /**
     * Cambiar estado de un turno
     * @param {number} id - ID del turno
     * @param {string} estado - Nuevo estado
     * @returns {Promise<Object>}
     */
    async cambiarEstado(id, estado) {
        try {
            const response = await turnosApi.patch(id, { estado });
            return response;
        } catch (error) {
            console.error('Error cambiando estado del turno:', error);
            throw error;
        }
    }
};

export default turnosService;
