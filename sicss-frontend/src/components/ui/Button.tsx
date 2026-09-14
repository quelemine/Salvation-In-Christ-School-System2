import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  style,
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:active:scale-100';

  const variantClasses = {
    primary: 'bg-sicss-primary text-white hover:bg-sicss-active active:bg-blue-800 focus:ring-sicss-primary',
    secondary: 'bg-white text-sicss-text-primary border border-sicss-border hover:bg-slate-50 active:bg-slate-300 focus:ring-sicss-primary',
    danger: 'bg-sicss-danger text-white hover:bg-red-700 active:bg-red-800 focus:ring-sicss-danger',
    ghost: 'bg-transparent text-sicss-text-primary hover:bg-slate-100 active:bg-slate-200 focus:ring-sicss-primary',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
