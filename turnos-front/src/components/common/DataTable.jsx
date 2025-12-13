import React from 'react';

/**
 * Componente DataTable reutilizable
 * 
 * @param {Array} data - Array de objetos a mostrar
 * @param {Array} columns - Definición de columnas [{ key, label, render? }]
 * @param {Function} onEdit - Callback al editar (recibe el item)
 * @param {Function} onDelete - Callback al eliminar (recibe el item)
 * @param {boolean} loading - Estado de carga
 * @param {string} emptyMessage - Mensaje cuando no hay datos
 * 
 * @example
 * <DataTable
 *   data={turnos}
 *   columns={[
 *     { key: 'fecha', label: 'Fecha' },
 *     { key: 'paciente', label: 'Paciente', render: (item) => item.paciente.nombre }
 *   ]}
 *   onEdit={(turno) => handleEdit(turno)}
 *   onDelete={(turno) => handleDelete(turno)}
 *   loading={loading}
 * />
 */
const DataTable = ({ 
    data = [], 
    columns = [], 
    onEdit, 
    onDelete, 
    loading = false,
    emptyMessage = "No hay datos disponibles"
}) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-100 border-b">
                    <tr>
                        {columns.map((column) => (
                            <th 
                                key={column.key} 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                                {column.label}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Acciones
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                            {columns.map((column) => (
                                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {column.render ? column.render(item) : item[column.key]}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                        >
                                            ✏️ Editar
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(item)}
                                            className="text-red-600 hover:text-red-900 transition-colors ml-4"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
