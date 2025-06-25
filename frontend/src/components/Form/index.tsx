import React, { useState } from 'react';

export type FieldType = 'text' | 'number' | 'email' | 'password' | 'select' | 'date' | 'textarea' | 'checkbox';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  pattern?: string;
  rows?: number;
  className?: string;
  step?: string | number;
}

interface FormProps {
  fields: FormField[];
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  isLoading?: boolean;
  error?: string;
  submitLabel?: string;
  children?: React.ReactNode;
  className?: string; // Added className prop
}

const Form: React.FC<FormProps> = ({
  fields,
  initialValues,
  onSubmit,
  isLoading = false,
  error,
  submitLabel = 'Submit',
  children,
  className, // Destructure className
}) => {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const commonClasses = (field: FormField) =>
    `block w-full rounded-md shadow-sm ${
      touched[field.name] && field.required && !values[field.name]
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-primary-500 focus:ring-blue-300'
    } ${field.className || ''}`;

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            className={`${commonClasses(field)} pl-3 pr-10 py-2 text-base sm:text-sm`}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={values[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            className={`${commonClasses(field)} py-2 px-3 text-base sm:text-sm`}
            required={field.required}
            placeholder={field.placeholder}
            rows={field.rows || 3}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={values[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              onBlur={() => handleBlur(field.name)}
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${field.className}`}
            />
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={values[field.name] || []}
            onChange={(e) =>
              handleChange(
                field.name,
                field.type === 'number' ? Number(e.target.value) : e.target.value
              )
            }
            onBlur={() => handleBlur(field.name)}
            className={`${commonClasses(field)} py-2 px-3 text-base sm:text-sm`}
            required={field.required}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            pattern={field.pattern}
            step={field.step}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className || ''}`}>
      {error && (
        <div
          className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {fields.map((field) => {
        const showError = touched[field.name] && field.required && !values[field.name];

        return (
          <div key={field.name} className="space-y-1">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700"
            >
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            <div className="mt-1">{renderField(field)}</div>
            {showError && (
              <p className="mt-1 text-sm text-red-600">{field.label} is required</p>
            )}
          </div>
        );
      })}

      {children}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default Form;