import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  type?: 'text' | 'email' | 'password' | 'date' | 'number' | 'search' | 'textarea';
  rows?: number;
}

export function Input({ label, error, helperText, type = 'text', rows = 3, className = '', ...props }: InputProps) {
  const baseClasses = 'w-full px-4 py-2.5 rounded-lg border border-sicss-border text-sicss-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sicss-primary focus:border-transparent transition-colors';
  const errorClasses = error ? 'border-sicss-danger focus:ring-sicss-danger' : '';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-sicss-text-primary">
          {label}
          {props.required && <span className="text-sicss-danger ml-1">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          className={`${baseClasses} ${errorClasses} ${className}`}
          rows={rows}
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          type={type}
          className={`${baseClasses} ${errorClasses} ${className}`}
          {...props}
        />
      )}
      {error && <p className="text-sm text-sicss-danger">{error}</p>}
      {helperText && !error && <p className="text-sm text-sicss-text-secondary">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, helperText, options, className = '', ...props }: SelectProps) {
  const baseClasses = 'w-full px-4 py-2.5 rounded-lg border border-sicss-border text-sicss-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-sicss-primary focus:border-transparent transition-colors';
  const errorClasses = error ? 'border-sicss-danger focus:ring-sicss-danger' : '';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-sicss-text-primary">
          {label}
          {props.required && <span className="text-sicss-danger ml-1">*</span>}
        </label>
      )}
      <select
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-sicss-danger">{error}</p>}
      {helperText && !error && <p className="text-sm text-sicss-text-secondary">{helperText}</p>}
    </div>
  );
}
