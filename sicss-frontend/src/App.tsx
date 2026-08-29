import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { useEffect } from 'react';
import { syncManager } from './sync/syncManager';
import { authService } from './services/authService';

// Accent colour palettes — maps store key → [bg, hover, ring, text, light-bg, light-text]
const ACCENT_MAP: Record<string, string[]> = {
  cyan:    ['#06b6d4', '#0891b2', '#67e8f9', '#0e7490', '#ecfeff', '#164e63'],
  blue:    ['#3b82f6', '#2563eb', '#93c5fd', '#1d4ed8', '#eff6ff', '#1e3a8a'],
  emerald: ['#10b981', '#059669', '#6ee7b7', '#047857', '#ecfdf5', '#064e3b'],
  violet:  ['#8b5cf6', '#7c3aed', '#c4b5fd', '#6d28d9', '#f5f3ff', '#2e1065'],
  rose:    ['#f43f5e', '#e11d48', '#fda4af', '#be123c', '#fff1f2', '#4c0519'],
  amber:   ['#f59e0b', '#d97706', '#fcd34d', '#b45309', '#fffbeb', '#451a03'],
  orange:  ['#f97316', '#ea580c', '#fdba74', '#c2410c', '#fff7ed', '#431407'],
  teal:    ['#14b8a6', '#0d9488', '#5eead4', '#0f766e', '#f0fdfa', '#042f2e'],
};

function ThemeInjector() {
  const { settings } = useSettingsStore();
  const { theme, reportCard } = settings;

  useEffect(() => {
    const accent = ACCENT_MAP[theme.accentColor] ?? ACCENT_MAP.cyan;
    const root = document.documentElement;

    // Accent CSS variables
    root.style.setProperty('--accent',        accent[0]);
    root.style.setProperty('--accent-hover',  accent[1]);
    root.style.setProperty('--accent-ring',   accent[2]);
    root.style.setProperty('--accent-dark',   accent[3]);
    root.style.setProperty('--accent-light',  accent[4]);
    root.style.setProperty('--accent-text',   accent[5]);

    // Font size root
    const fontSizes: Record<string, string> = { compact: '12px', normal: '14px', large: '16px' };
    root.style.setProperty('--base-font', fontSizes[theme.fontSize] ?? '14px');
    root.style.fontSize = fontSizes[theme.fontSize] ?? '14px';

    // Density padding
    const pads: Record<string, string> = { compact: '0.5rem', comfortable: '1rem', spacious: '1.5rem' };
    root.style.setProperty('--cell-pad', pads[theme.density] ?? '1rem');

    // Border radius
    const radii: Record<string, string> = { sharp: '0', rounded: '0.5rem', pill: '9999px' };
    root.style.setProperty('--radius', radii[theme.borderRadius] ?? '0.5rem');

    // Report card print page orientation
    const rcStyle = document.getElementById('rc-print-style') ?? (() => {
      const s = document.createElement('style');
      s.id = 'rc-print-style';
      document.head.appendChild(s);
      return s;
    })();
    rcStyle.textContent = `@media print { @page { size: A4 ${reportCard.layout}; margin: 8mm; } }`;

    // Body data-attrs for CSS selectors in index.css
    root.setAttribute('data-sidebar', theme.sidebarStyle);
    root.setAttribute('data-density', theme.density);
    root.setAttribute('data-radius', theme.borderRadius);
    root.setAttribute('data-accent', theme.accentColor);
  }, [theme, reportCard.layout]);

  return null;
}

function App() {
  const { isAuthenticated, updateUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      authService.me().then(updateUser).catch(() => undefined);
    }
  }, [isAuthenticated, updateUser]);

  useEffect(() => {
    if (isAuthenticated) {
      syncManager.startAutoSync(60000);
    }
    return () => { syncManager.stopAutoSync(); };
  }, [isAuthenticated]);

  return (
    <>
      <ThemeInjector />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
