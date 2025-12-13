import { useState, useEffect } from 'react';

/**
 * Custom hook para llamadas API con manejo automático de loading y error
 * @param {Function} apiCall - Función async que devuelve una promesa
 * @param {Array} dependencies - Dependencias para re-ejecutar la llamada (como useEffect)
 * @returns {Object} - { data, loading, error, refetch }
 * 
 * @example
 * const { data: turnos, loading, error, refetch } = useApi(
 *   () => turnosApi.getAll({ fecha: '2024-01-15' }),
 *   []
 * );
 */
export function useApi(apiCall, dependencies = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiCall();
            setData(result);
        } catch (err) {
            console.error('Error en useApi:', err);
            setError(err.response?.data?.detail || err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    return { 
        data, 
        loading, 
        error, 
        refetch: fetchData 
    };
}

/**
 * Custom hook para mutaciones (POST, PUT, DELETE)
 * @returns {Object} - { mutate, loading, error, data }
 * 
 * @example
 * const { mutate, loading } = useMutation();
 * 
 * const handleSubmit = async () => {
 *   await mutate(() => turnosApi.create(turnoData));
 * };
 */
export function useMutation() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (apiCall) => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiCall();
            setData(result);
            return result;
        } catch (err) {
            console.error('Error en useMutation:', err);
            const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, loading, error, data };
}

export default useApi;
