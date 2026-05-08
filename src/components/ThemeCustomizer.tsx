import { useState, useEffect } from 'react';
import type { ThemeSettings, ThemeColors, ThemePresetId, LayoutDensity } from '../types/quiz';

const THEME_KEY = 'scorm-quiz-builder-theme';

const PRESETS: Record<ThemePresetId, ThemeColors> = {
  default: {
    brand: '#2563eb', brandDark: '#1d4ed8', brandLight: '#eff6ff',
    success: '#22c55e', successBg: '#f0fdf4',
    danger: '#ef4444', dangerBg: '#fef2f2',
    warning: '#f59e0b', warningBg: '#fffbeb',
    text: '#1a1a2e', textMuted: '#64748b',
    border: '#e2e8f0', surface: '#f8fafc', white: '#ffffff',
  },
  dark: {
    brand: '#60a5fa', brandDark: '#3b82f6', brandLight: '#1e3a5f',
    success: '#4ade80', successBg: '#052e16',
    danger: '#f87171', dangerBg: '#450a0a',
    warning: '#fbbf24', warningBg: '#451a03',
    text: '#f1f5f9', textMuted: '#94a3b8',
    border: '#334155', surface: '#1e293b', white: '#0f172a',
  },
  ocean: {
    brand: '#0891b2', brandDark: '#0e7490', brandLight: '#ecfeff',
    success: '#10b981', successBg: '#ecfdf5',
    danger: '#f43f5e', dangerBg: '#fff1f2',
    warning: '#f59e0b', warningBg: '#fffbeb',
    text: '#0c4a6e', textMuted: '#0369a1',
    border: '#bae6fd', surface: '#f0f9ff', white: '#ffffff',
  },
  forest: {
    brand: '#16a34a', brandDark: '#15803d', brandLight: '#f0fdf4',
    success: '#22c55e', successBg: '#dcfce7',
    danger: '#ef4444', dangerBg: '#fef2f2',
    warning: '#ca8a04', warningBg: '#fefce8',
    text: '#14532d', textMuted: '#4d7c0f',
    border: '#bbf7d0', surface: '#f0fdf4', white: '#ffffff',
  },
  rose: {
    brand: '#e11d48', brandDark: '#be123c', brandLight: '#fff1f2',
    success: '#22c55e', successBg: '#f0fdf4',
    danger: '#f43f5e', dangerBg: '#fff1f2',
    warning: '#f59e0b', warningBg: '#fffbeb',
    text: '#4c0519', textMuted: '#9f1239',
    border: '#fecdd3', surface: '#fff1f2', white: '#ffffff',
  },
  slate: {
    brand: '#475569', brandDark: '#334155', brandLight: '#f1f5f9',
    success: '#22c55e', successBg: '#f0fdf4',
    danger: '#ef4444', dangerBg: '#fef2f2',
    warning: '#f59e0b', warningBg: '#fffbeb',
    text: '#0f172a', textMuted: '#64748b',
    border: '#cbd5e1', surface: '#f8fafc', white: '#ffffff',
  },
};

const PRESET_LABELS: Record<ThemePresetId, string> = {
  default: 'Default',
  dark: 'Dark',
  ocean: 'Ocean',
  forest: 'Forest',
  rose: 'Rose',
  slate: 'Slate',
};

const LAYOUT_OPTIONS: { id: LayoutDensity; name: string; desc: string; radius: string }[] = [
  { id: 'compact', name: 'Compact', desc: 'Sharp corners, tight spacing', radius: '4px' },
  { id: 'default', name: 'Default', desc: 'Balanced look and feel', radius: '8px' },
  { id: 'spacious', name: 'Spacious', desc: 'Rounded, airy design', radius: '14px' },
];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'brand', label: 'Primary / Brand' },
  { key: 'success', label: 'Success' },
  { key: 'danger', label: 'Danger' },
  { key: 'warning', label: 'Warning' },
  { key: 'surface', label: 'Page Background' },
  { key: 'white', label: 'Card Background' },
  { key: 'text', label: 'Body Text' },
  { key: 'textMuted', label: 'Muted Text' },
];

const DEFAULT_THEME: ThemeSettings = {
  preset: 'default',
  overrides: {},
  layout: 'default',
};

function applyTheme(settings: ThemeSettings) {
  const base = PRESETS[settings.preset];
  const colors: ThemeColors = { ...base, ...settings.overrides };
  const s = document.documentElement.style;

  s.setProperty('--brand', colors.brand);
  s.setProperty('--brand-dark', colors.brandDark);
  s.setProperty('--brand-light', colors.brandLight);
  s.setProperty('--success', colors.success);
  s.setProperty('--success-bg', colors.successBg);
  s.setProperty('--danger', colors.danger);
  s.setProperty('--danger-bg', colors.dangerBg);
  s.setProperty('--warning', colors.warning);
  s.setProperty('--warning-bg', colors.warningBg);
  s.setProperty('--text', colors.text);
  s.setProperty('--text-muted', colors.textMuted);
  s.setProperty('--border', colors.border);
  s.setProperty('--surface', colors.surface);
  s.setProperty('--white', colors.white);

  const radiusMap: Record<LayoutDensity, string> = {
    compact: '4px',
    default: '8px',
    spacious: '14px',
  };
  s.setProperty('--radius', radiusMap[settings.layout]);
}

function loadTheme(): ThemeSettings {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as ThemeSettings;
    if (!parsed.preset || !PRESETS[parsed.preset]) return DEFAULT_THEME;
    return parsed;
  } catch {
    return DEFAULT_THEME;
  }
}

function saveTheme(settings: ThemeSettings) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export default function ThemeCustomizer() {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME);

  useEffect(() => {
    const saved = loadTheme();
    setSettings(saved);
    applyTheme(saved);
  }, []);

  function updateSettings(next: ThemeSettings) {
    setSettings(next);
    saveTheme(next);
    applyTheme(next);
  }

  function handlePresetSelect(id: ThemePresetId) {
    updateSettings({ ...settings, preset: id, overrides: {} });
  }

  function handleColorOverride(key: keyof ThemeColors, value: string) {
    updateSettings({ ...settings, overrides: { ...settings.overrides, [key]: value } });
  }

  function handleLayoutChange(layout: LayoutDensity) {
    updateSettings({ ...settings, layout });
  }

  function handleReset() {
    updateSettings(DEFAULT_THEME);
  }

  const effectiveColors: ThemeColors = { ...PRESETS[settings.preset], ...settings.overrides };
  const isDefault = settings.preset === 'default' && settings.layout === 'default' && Object.keys(settings.overrides).length === 0;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>

      {/* Preset Themes */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="theme-section-header">
            <span className="theme-section-title">Preset Themes</span>
          </div>
        </div>
        <div className="card-body">
          <div className="theme-preset-grid">
            {(Object.keys(PRESETS) as ThemePresetId[]).map((id) => {
              const p = PRESETS[id];
              const isActive = settings.preset === id && Object.keys(settings.overrides).length === 0;
              return (
                <button
                  key={id}
                  className={`theme-preset-card ${isActive ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(id)}
                >
                  <div className="theme-preset-swatches">
                    <span className="theme-preset-swatch" style={{ background: p.white }} />
                    <span className="theme-preset-swatch" style={{ background: p.surface }} />
                    <span className="theme-preset-swatch" style={{ background: p.brand }} />
                    <span className="theme-preset-swatch" style={{ background: p.success }} />
                    <span className="theme-preset-swatch" style={{ background: p.danger }} />
                  </div>
                  <div className="theme-preset-name">{PRESET_LABELS[id]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Colors */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <details style={{ width: '100%' }}>
            <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="theme-section-title">Custom Colors</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click to expand</span>
            </summary>
            <div className="card-body" style={{ paddingTop: 16 }}>
              <div className="theme-color-grid">
                {COLOR_FIELDS.map(({ key, label }) => (
                  <div key={key} className="theme-color-row">
                    <input
                      type="color"
                      value={effectiveColors[key]}
                      onChange={(e) => handleColorOverride(key, e.target.value)}
                      title={label}
                    />
                    <span className="color-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Layout Density */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="theme-section-title">Layout Density</span>
        </div>
        <div className="card-body">
          <div className="theme-layout-grid">
            {LAYOUT_OPTIONS.map(({ id, name, desc }) => (
              <button
                key={id}
                className={`theme-layout-card ${settings.layout === id ? 'active' : ''}`}
                onClick={() => handleLayoutChange(id)}
              >
                <div className="theme-layout-card-name">{name}</div>
                <div className="theme-layout-card-desc">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleReset}
          disabled={isDefault}
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
