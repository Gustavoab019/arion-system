// Arquivo: /src/components/ui/DesignSystem.tsx
// DESIGN SYSTEM - COMPONENTES INDUSTRIAIS PADRONIZADOS

import React from 'react';

// =============================================================================
// PALETA DE CORES - CONSTANTES
// =============================================================================
export const COLORS = {
  primary: {
    600: '#1e40af', // Azul corporativo principal
    500: '#3b82f6', // Azul corporativo secundário
  },
  gray: {
    900: '#111827',
    800: '#1f2937',
    700: '#374151',
    600: '#4b5563',
    500: '#64748b', // Cinza técnico
    400: '#94a3b8', // Cinza claro
    300: '#cbd5e1',
    200: '#e2e8f0',
    100: '#f1f5f9',
    50: '#f8fafc',  // Background cinza
  },
  status: {
    success: '#10b981', // Verde - concluído
    warning: '#f59e0b', // Amarelo - em andamento
    error: '#ef4444',   // Vermelho - problemas
    pending: '#6b7280', // Cinza - pendente
  },
  white: '#ffffff',
} as const;

// =============================================================================
// BOTÃO INDUSTRIAL - COMPONENTE BASE
// =============================================================================
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button'
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
    error: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        font-medium border-2 rounded transition-all duration-200 
        flex items-center justify-center space-x-2
      `}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      <span>{children}</span>
    </button>
  );
}

// =============================================================================
// INPUT INDUSTRIAL - ROBUSTO E FUNCIONAL
// =============================================================================
interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  helper,
  icon
}: InputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            ${icon ? 'pl-10' : 'pl-3'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            block w-full pr-3 py-2 border rounded-lg 
            focus:ring-2 focus:ring-opacity-50 focus:outline-none
            text-gray-900 placeholder-gray-500
          `}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}

// =============================================================================
// CARD INDUSTRIAL - CONTAINER PADRONIZADO
// =============================================================================
interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function Card({ children, title, subtitle, action, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// STATUS BADGE - INDICADOR VISUAL DE ESTADO
// =============================================================================
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, children, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    success: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    error: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
    info: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const config = statusConfig[status];

  return (
    <span className={`
      ${config.bg} ${config.text} ${config.border} ${sizes[size]}
      border rounded-full font-medium inline-flex items-center
    `}>
      {children}
    </span>
  );
}

// =============================================================================
// LOADING SPINNER - SIMPLES E EFICAZ
// =============================================================================
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ size = 'md', text }: LoadingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
      {text && (
        <p className="text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
}

// =============================================================================
// ALERT - NOTIFICAÇÕES E AVISOS
// =============================================================================
interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
}

export function Alert({ type, title, message, onClose }: AlertProps) {
  const typeConfig = {
    success: { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      text: 'text-green-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    warning: { 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200', 
      text: 'text-yellow-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    error: { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      text: 'text-red-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: { 
      bg: 'bg-blue-50', 
      border: 'border-blue-200', 
      text: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const config = typeConfig[type];

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
      <div className="flex items-start space-x-3">
        <div className={`${config.text} flex-shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`${config.text} font-medium`}>{title}</h3>
          {message && (
            <p className={`${config.text} text-sm mt-1 opacity-90`}>{message}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${config.text} hover:opacity-75 transition-opacity`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TABLE - TABELA FUNCIONAL PARA DADOS
// =============================================================================
interface TableProps {
  headers: string[];
  data: Array<Record<string, any>>;
  actions?: (row: any, index: number) => React.ReactNode;
}

export function Table({ headers, data, actions }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {headers.map((header) => (
                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[header.toLowerCase()] || '-'}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {actions(row, index)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// MODAL - OVERLAY FUNCIONAL SEM FRESCURAS
// =============================================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="px-6 py-4">
            {children}
          </div>
          
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}