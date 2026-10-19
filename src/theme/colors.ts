export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',

  background: '#F8FAFC',
  surface: '#FFFFFF',

  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },

  border: {
    default: '#CBD5E1',
    focus: '#2563EB',
    error: '#DC2626',
  },

  status: {
    error: '#DC2626',
    errorBackground: '#FEF2F2',
    success: '#16A34A',
    successBackground: '#F0FDF4',
    warning: '#D97706',
  },
} as const;

export type AppColors = typeof colors;
