// Design system constants and color palette

export const colors = {
  // Primary colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#4a90e2',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Secondary colors
  secondary: {
    500: '#6c63ff',
    600: '#5850e6',
  },
  
  // Status colors
  success: {
    50: '#dcfce7',
    100: '#bbf7d0',
    500: '#5cb85c',
    600: '#22c55e',
  },
  
  warning: {
    50: '#fef9c3',
    100: '#fef08a',
    500: '#f0ad4e',
    600: '#eab308',
  },
  
  danger: {
    50: '#fee2e2',
    100: '#fecaca',
    500: '#d9534f',
    600: '#ef4444',
  },
  
  orange: {
    50: '#ffedd5',
    100: '#fed7aa',
    500: '#f97316',
  },
  
  // Neutral colors
  neutral: {
    50: '#f7f9fc',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const gradients = {
  primary: 'linear-gradient(135deg, #4a90e2 0%, #6c63ff 100%)',
  success: 'linear-gradient(135deg, #5cb85c 0%, #22c55e 100%)',
  warning: 'linear-gradient(135deg, #f0ad4e 0%, #eab308 100%)',
};

export const shadows = {
  sm: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
  md: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
};

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  '3xl': '3rem',  // 48px
};

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
};
