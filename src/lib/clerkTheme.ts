import type { Appearance } from '@clerk/types'

export const nxTheme: Appearance = {
  variables: {
    colorBackground: '#0a1223',
    colorInputBackground: '#060d18',
    colorInputText: '#c8dff0',
    colorText: '#c8dff0',
    colorTextSecondary: '#4a6080',
    colorPrimary: '#00c8ff',
    colorDanger: '#ff6b8a',
    colorSuccess: '#00c8ff',
    colorNeutral: '#1a2a3a',
    colorShimmer: 'rgba(0,200,255,0.05)',
    borderRadius: '6px',
    fontFamily: "'Exo 2', sans-serif",
    fontFamilyButtons: "'Rajdhani', sans-serif",
    fontSize: '0.9rem',
    spacingUnit: '1rem',
  },
  elements: {
    card: {
      background: 'rgba(10, 18, 35, 0.85)',
      border: '1px solid rgba(0, 200, 255, 0.18)',
      borderRadius: '12px',
      boxShadow: '0 0 0 1px rgba(0,200,255,0.05), 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,200,255,0.08)',
    },
    headerTitle: {
      fontFamily: "'Rajdhani', sans-serif",
      fontWeight: '700',
      fontSize: '1.8rem',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: '#e8f4ff',
    },
    headerSubtitle: {
      color: '#4a6080',
      fontSize: '0.82rem',
    },
    dividerLine: {
      background: 'linear-gradient(90deg, rgba(0,200,255,0.15), rgba(123,79,255,0.15), transparent)',
    },
    dividerText: {
      color: '#3a5570',
      fontSize: '0.75rem',
      letterSpacing: '0.08em',
      fontFamily: "'Rajdhani', sans-serif",
      textTransform: 'uppercase',
    },
    formFieldLabel: {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#3a5570',
    },
    formFieldInput: {
      background: 'rgba(0, 200, 255, 0.03)',
      border: '1px solid rgba(0, 200, 255, 0.12)',
      borderRadius: '6px',
      color: '#c8dff0',
      fontSize: '0.9rem',
    },
    formFieldInputShowPasswordButton: {
      color: '#3a5570',
    },
    formButtonPrimary: {
      background: 'transparent',
      border: '1px solid rgba(0, 200, 255, 0.35)',
      borderRadius: '6px',
      color: '#00c8ff',
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '1rem',
      fontWeight: '600',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
    socialButtonsBlockButton: {
      background: 'rgba(0, 200, 255, 0.03)',
      border: '1px solid rgba(0, 200, 255, 0.12)',
      borderRadius: '6px',
      color: '#c8dff0',
    },
    socialButtonsBlockButtonText: {
      fontFamily: "'Exo 2', sans-serif",
      fontWeight: '400',
      color: '#c8dff0',
    },
    footerActionLink: {
      color: '#00c8ff',
      fontWeight: '500',
    },
    footerActionText: {
      color: '#4a6080',
    },
    formFieldErrorText: {
      color: '#ff6b8a',
      fontSize: '0.78rem',
    },
    alertText: {
      color: '#ff6b8a',
    },
    identityPreviewText: {
      color: '#c8dff0',
    },
    identityPreviewEditButton: {
      color: '#00c8ff',
    },
  },
}