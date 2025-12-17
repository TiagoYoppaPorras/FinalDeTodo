import React from "react";

/**
 * Componente DataTable Responsivo
 * - Desktop: Muestra una tabla tradicional.
 * - Mobile: Transforma cada fila en una "Tarjeta" (Card) para mejor lectura.
 */
const DataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No hay datos disponibles",
}) => {
  // 🔹 Renderizado del estado de Carga
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 🔹 Renderizado si no hay datos
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 📱 VISTA MÓVIL (Cards) - Visible solo en pantallas pequeñas (md:hidden) */}
      <div className="block md:hidden space-y-4">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            {/* Datos de la fila */}
            <div className="space-y-3">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex justify-between items-start border-b border-gray-50 last:border-0 pb-2 last:pb-0"
                >
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {column.label}
                  </span>
                  <span className="text-sm text-gray-900 text-right font-medium pl-4">
                    {column.render ? column.render(item) : item[column.key]}
                  </span>
                </div>
              ))}
            </div>

            {/* Botones de Acción (si existen) */}
            {(onEdit || onDelete) && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 💻 VISTA ESCRITORIO (Tabla) - Visible solo en pantallas medianas en adelante (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-900 transition-colors hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        ✏️ Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-900 transition-colors hover:bg-red-50 px-2 py-1 rounded"
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
    </div>
  );
};

export default DataTable;
