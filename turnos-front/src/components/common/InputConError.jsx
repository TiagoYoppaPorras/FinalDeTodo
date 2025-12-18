import { AlertCircle } from "lucide-react";
import PropTypes from "prop-types";

/**
 * Componente de input con validación visual y mensaje de error
 * @param {string} label - Etiqueta del campo (opcional)
 * @param {string} value - Valor del input
 * @param {function} onChange - Función para manejar cambios
 * @param {string} error - Mensaje de error a mostrar
 * @param {string} type - Tipo de input (text, email, password, etc.)
 * @param {string} placeholder - Placeholder del input
 * @param {boolean} required - Si el campo es obligatorio
 * @param {string} className - Clases CSS adicionales
 */
const InputConError = ({ 
  label, 
  value, 
  onChange, 
  error, 
  type = "text", 
  placeholder = "",
  required = false,
  className = ""
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input 
          type={type} 
          placeholder={placeholder}
          className={`w-full border rounded-lg p-2 outline-none transition-colors
            ${error 
              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            } ${className}`}
          value={value} 
          onChange={onChange}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p 
          id={`${label}-error`}
          className="mt-1 text-xs text-red-600 font-medium flex items-start gap-1"
        >
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

InputConError.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string
};

export default InputConError;
