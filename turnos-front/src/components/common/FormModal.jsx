import React from 'react';

/**
 * Componente FormModal reutilizable
 * 
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {Function} onClose - Callback al cerrar el modal
 * @param {string} title - Título del modal
 * @param {Function} onSubmit - Callback al enviar el formulario
 * @param {ReactNode} children - Contenido del formulario
 * @param {boolean} loading - Estado de carga (deshabilita botones)
 * @param {string} submitText - Texto del botón de enviar
 * @param {string} cancelText - Texto del botón de cancelar
 * 
 * @example
 * <FormModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   title="Nuevo Turno"
 *   onSubmit={handleSubmit}
 *   loading={loading}
 * >
 *   <input name="fecha" type="date" />
 *   <input name="hora" type="time" />
 * </FormModal>
 */
const FormModal = ({ 
    isOpen, 
    onClose, 
    title, 
    onSubmit, 
    children, 
    loading = false,
    submitText = "Guardar",
    cancelText = "Cancelar"
}) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={loading}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            {children}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                {submitText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FormModal;
