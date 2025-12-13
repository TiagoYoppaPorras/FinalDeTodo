import Client from './Client';

/**
 * Servicio API genérico para operaciones CRUD
 * Elimina la duplicación de código en todos los servicios API
 */
export class ApiService {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    /**
     * Obtener todos los recursos con parámetros opcionales
     * @param {Object} params - Parámetros de query (filtros, paginación, etc.)
     * @returns {Promise<Array>}
     */
    async getAll(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
            const response = await Client.get(url);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo ${this.endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Obtener un recurso por ID
     * @param {number} id - ID del recurso
     * @returns {Promise<Object>}
     */
    async getById(id) {
        try {
            const response = await Client.get(`${this.endpoint}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo ${this.endpoint}/${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear un nuevo recurso
     * @param {Object} data - Datos del recurso a crear
     * @returns {Promise<Object>}
     */
    async create(data) {
        try {
            const response = await Client.post(this.endpoint, data);
            return response.data;
        } catch (error) {
            console.error(`Error creando ${this.endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Actualizar un recurso existente
     * @param {number} id - ID del recurso
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        try {
            const response = await Client.put(`${this.endpoint}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando ${this.endpoint}/${id}:`, error);
            throw error;
        }
    }

    /**
     * Actualización parcial (PATCH)
     * @param {number} id - ID del recurso
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async patch(id, data) {
        try {
            const response = await Client.patch(`${this.endpoint}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando (PATCH) ${this.endpoint}/${id}:`, error);
            throw error;
        }
    }

    /**
     * Eliminar un recurso
     * @param {number} id - ID del recurso a eliminar
     * @returns {Promise<Object>}
     */
    async delete(id) {
        try {
            const response = await Client.delete(`${this.endpoint}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando ${this.endpoint}/${id}:`, error);
            throw error;
        }
    }
}

// 🎯 Instancias para cada recurso
export const turnosApi = new ApiService('/turnos');
export const pacientesApi = new ApiService('/pacientes');
export const kinesiologosApi = new ApiService('/kinesiologos');
export const serviciosApi = new ApiService('/servicios');
export const salasApi = new ApiService('/salas');
export const usuariosApi = new ApiService('/usuarios');
export const rolesApi = new ApiService('/roles');

// Exportar clase por defecto
export default ApiService;
