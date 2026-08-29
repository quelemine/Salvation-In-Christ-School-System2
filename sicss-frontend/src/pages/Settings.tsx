import { useState, useRef } from 'react';
import { useSettingsStore, type AccentColor, type SidebarStyle, type FontSize, type LayoutDensity, type BankAccount } from '../store/settingsStore';
import api from '../services/api';

type Tab = 'branding' | 'theme' | 'typography' | 'layout' | 'payment' | 'reportcard' | 'system' | 'reset';

const ACCENT_COLORS: { value: AccentColor; label: string; hex: string }[] = [
  { value: 'cyan',    label: 'Cyan',    hex: '#06b6d4' },
  { value: 'blue',    label: 'Blue',    hex: '#3b82f6' },
  { value: 'emerald', label: 'Emerald', hex: '#10b981' },
  { value: 'violet',  label: 'Violet',  hex: '#8b5cf6' },
  { value: 'rose',    label: 'Rose',    hex: '#f43f5e' },
  { value: 'amber',   label: 'Amber',   hex: '#f59e0b' },
  { value: 'orange',  label: 'Orange',  hex: '#f97316' },
  { value: 'teal',    label: 'Teal',    hex: '#14b8a6' },
];

const SIDEBAR_STYLES: { value: SidebarStyle; label: string; desc: string }[] = [
  { value: 'dark',    label: 'Dark',    desc: 'Dark slate sidebar (default)' },
  { value: 'light',   label: 'Light',   desc: 'White sidebar with borders' },
  { value: 'colored', label: 'Colored', desc: 'Accent-colored sidebar' },
];

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'compact', label: 'Compact (12px base)' },
  { value: 'normal',  label: 'Normal (14px base)' },
  { value: 'large',   label: 'Large (16px base)' },
];

const DENSITIES: { value: LayoutDensity; label: string; desc: string }[] = [
  { value: 'compact',     label: 'Compact',     desc: 'Tight padding — more data on screen' },
  { value: 'comfortable', label: 'Comfortable', desc: 'Balanced spacing (default)' },
  { value: 'spacious',    label: 'Spacious',    desc: 'Generous padding — easier reading' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">{children}</h3>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

export default function Settings() {
  const { settings, updateBranding, updateTheme, updateReportCard, updateSystem, updatePayment, resetAll } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('branding');
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const save = (fn: () => void) => {
    fn();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (settings.branding.logoUrl && !settings.branding.logoUrl.startsWith('data:')) {
        const match = settings.branding.logoUrl.match(/\/storage\/(.+)$/);
        if (match) form.append('old_path', match[1]);
      }
      const res = await api.post('/upload/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateBranding({ logoUrl: res.data.full_url });
    } catch {
      setUploadError('Upload failed. Make sure the server is running and you are logged in as admin.');
    } finally {
      setUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    const url = settings.branding.logoUrl;
    if (!url) return;
    try {
      if (!url.startsWith('data:')) {
        const match = url.match(/\/storage\/(.+)$/);
        if (match) await api.delete('/upload/logo', { data: { path: match[1] } });
      }
    } catch { /* still clear locally */ }
    updateBranding({ logoUrl: '' });
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'branding',   label: 'Branding',     icon: '🏫' },
    { key: 'theme',      label: 'Colors',        icon: '🎨' },
    { key: 'typography', label: 'Typography',    icon: '🔤' },
    { key: 'layout',     label: 'Layout',        icon: '⬛' },
    { key: 'payment',    label: 'Payments',      icon: '💳' },
    { key: 'reportcard', label: 'Report card',   icon: '📋' },
    { key: 'system',     label: 'System',        icon: '⚙️' },
    { key: 'reset',      label: 'Reset',         icon: '🔄' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Customize the appearance, branding, and behavior of the entire system.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <span>✓</span> Settings saved successfully.
        </div>
      )}

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar tabs */}
        <aside className="lg:w-52 shrink-0">
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                  activeTab === t.key
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── BRANDING ── */}
          {activeTab === 'branding' && (
            <Card>
              <SectionTitle>School identity</SectionTitle>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="School name" hint="Shown in the sidebar, report cards, and receipts.">
                  <input className="input-field" value={settings.branding.schoolName}
                    onChange={(e) => updateBranding({ schoolName: e.target.value })} />
                </Field>
                <Field label="Subtitle / tagline">
                  <input className="input-field" value={settings.branding.schoolSubtitle}
                    onChange={(e) => updateBranding({ schoolSubtitle: e.target.value })} />
                </Field>
                <Field label="School motto">
                  <input className="input-field" value={settings.branding.schoolMotto}
                    onChange={(e) => updateBranding({ schoolMotto: e.target.value })} />
                </Field>
                <Field label="Address">
                  <input className="input-field" value={settings.branding.schoolAddress}
                    onChange={(e) => updateBranding({ schoolAddress: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <input className="input-field" value={settings.branding.schoolPhone}
                    onChange={(e) => updateBranding({ schoolPhone: e.target.value })} />
                </Field>
                <Field label="Email">
                  <input type="email" className="input-field" value={settings.branding.schoolEmail}
                    onChange={(e) => updateBranding({ schoolEmail: e.target.value })} />
                </Field>
                <Field label="Website">
                  <input className="input-field" value={settings.branding.schoolWebsite}
                    onChange={(e) => updateBranding({ schoolWebsite: e.target.value })} />
                </Field>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <SectionTitle>School logo</SectionTitle>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden">
                    {settings.branding.logoUrl
                      ? <img src={settings.branding.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      : <span className="text-3xl">🏫</span>}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Upload a PNG or SVG logo. It will appear on report cards and receipts. Recommended size: 200×200 px.</p>
                    <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                    <div className="flex gap-2">
                      <button onClick={() => logoInputRef.current?.click()} disabled={uploading} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        {uploading ? 'Uploading…' : 'Upload logo'}
                      </button>
                      {settings.branding.logoUrl && (
                        <button onClick={handleLogoRemove} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                          Remove
                        </button>
                      )}
                    </div>
                    {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
                  </div>
                </div>
              </div>

              <button onClick={() => save(() => {})} className="mt-6 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
                Save branding
              </button>

              {/* Login page preview */}
              <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600">Login page preview</p>
                  <span className="text-[10px] text-slate-400">Updates live as you type above</span>
                </div>
                <div className="flex" style={{ minHeight: 160 }}>
                  {/* Left panel preview */}
                  <div className="flex w-2/5 flex-col items-center justify-center gap-3 p-5"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0e7490 100%)' }}>
                    {settings.branding.logoUrl
                      ? <img src={settings.branding.logoUrl} alt="Logo preview" className="h-12 w-12 rounded-xl object-contain shadow-lg" />
                      : <div className="h-12 w-12 rounded-xl bg-cyan-400 flex items-center justify-center shadow-lg"><span className="text-xl font-black text-slate-950">S</span></div>
                    }
                    <div className="text-center">
                      <p className="text-xs font-black text-white leading-tight">{settings.branding.schoolName || 'School Name'}</p>
                      {settings.branding.schoolSubtitle && <p className="text-[9px] text-white/50 mt-0.5">{settings.branding.schoolSubtitle}</p>}
                      {settings.branding.schoolMotto && <p className="text-[9px] text-cyan-300 italic mt-1">"{settings.branding.schoolMotto}"</p>}
                      {settings.branding.schoolAddress && <p className="text-[9px] text-white/30 mt-0.5">{settings.branding.schoolAddress}</p>}
                    </div>
                  </div>
                  {/* Right form preview */}
                  <div className="flex flex-1 flex-col justify-center bg-slate-50 px-5 py-4 gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-700">{settings.system.systemName}</p>
                    <p className="text-sm font-bold text-slate-950">Welcome back</p>
                    <p className="text-[10px] text-slate-400 mb-1">Sign in to your account to continue</p>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-400">Email address</div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-400">Password</div>
                    <div className="mt-1 rounded-lg px-3 py-2 text-center text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--accent, #0891b2)' }}>Sign in</div>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                  <p className="text-[10px] text-slate-500">
                    💡 Edit <strong>School name</strong>, <strong>Subtitle</strong>, <strong>Motto</strong>, <strong>Address</strong>, and <strong>Logo</strong> above to customise how your login page looks.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ── COLORS / THEME ── */}
          {activeTab === 'theme' && (
            <Card>
              <SectionTitle>Accent color</SectionTitle>
              <p className="mb-4 text-xs text-slate-400">Used for active nav items, buttons, links, and highlights throughout the UI.</p>
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => save(() => updateTheme({ accentColor: c.value }))}
                    title={c.label}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                      settings.theme.accentColor === c.value ? 'ring-2 ring-offset-2 ring-slate-950' : 'hover:scale-105'
                    }`}
                  >
                    <span className="block h-10 w-10 rounded-full shadow-sm" style={{ backgroundColor: c.hex }} />
                    <span className="text-xs font-medium text-slate-600">{c.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <SectionTitle>Sidebar style</SectionTitle>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {SIDEBAR_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => save(() => updateTheme({ sidebarStyle: s.value }))}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        settings.theme.sidebarStyle === s.value
                          ? 'border-slate-950 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Preview strip */}
                      <div className={`mb-3 flex h-12 w-full overflow-hidden rounded-lg ${
                        s.value === 'dark' ? 'bg-slate-950' :
                        s.value === 'light' ? 'bg-white border border-slate-200' :
                        'bg-cyan-600'
                      }`}>
                        <div className="flex flex-col gap-1 p-2">
                          {[...Array(3)].map((_, i) => (
                            <span key={i} className={`block h-1.5 w-12 rounded-full opacity-50 ${s.value === 'light' ? 'bg-slate-400' : 'bg-white'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <SectionTitle>Border radius</SectionTitle>
                <div className="flex gap-3">
                  {(['sharp', 'rounded', 'pill'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => save(() => updateTheme({ borderRadius: r }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        settings.theme.borderRadius === r ? 'border-slate-950 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`block h-10 w-16 bg-slate-900 ${
                        r === 'sharp' ? 'rounded-none' : r === 'rounded' ? 'rounded-lg' : 'rounded-full'
                      }`} />
                      <span className="text-xs font-medium capitalize text-slate-600">{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <SectionTitle>Navigation icons</SectionTitle>
                <label className="flex cursor-pointer items-center gap-3">
                  <div
                    onClick={() => save(() => updateTheme({ showIcons: !settings.theme.showIcons }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${settings.theme.showIcons ? 'bg-slate-950' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.theme.showIcons ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Show emoji icons in sidebar</span>
                </label>
              </div>
            </Card>
          )}

          {/* ── TYPOGRAPHY ── */}
          {activeTab === 'typography' && (
            <Card>
              <SectionTitle>Font size</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {FONT_SIZES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => save(() => updateTheme({ fontSize: f.value }))}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      settings.theme.fontSize === f.value
                        ? 'border-slate-950 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`block font-semibold text-slate-900 ${f.value === 'compact' ? 'text-xs' : f.value === 'normal' ? 'text-sm' : 'text-base'}`}>
                      Aa
                    </span>
                    <p className="mt-1 text-xs text-slate-500">{f.label}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ── LAYOUT / DENSITY ── */}
          {activeTab === 'layout' && (
            <Card>
              <SectionTitle>Content density</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DENSITIES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => save(() => updateTheme({ density: d.value }))}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      settings.theme.density === d.value
                        ? 'border-slate-950 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Density preview */}
                    <div className={`mb-3 space-y-1 ${d.value === 'compact' ? 'space-y-0.5' : d.value === 'spacious' ? 'space-y-2' : 'space-y-1'}`}>
                      {[...Array(3)].map((_, i) => (
                        <span key={i} className={`block w-full rounded bg-slate-200 ${
                          d.value === 'compact' ? 'h-2' : d.value === 'spacious' ? 'h-4' : 'h-3'
                        }`} />
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{d.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{d.desc}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ── PAYMENT CONFIGURATION ── */}
          {activeTab === 'payment' && (
            <div className="space-y-5">

              {/* Cash */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle>Cash payment</SectionTitle>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => updatePayment({ cashEnabled: !settings.payment.cashEnabled })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${settings.payment.cashEnabled ? 'bg-slate-950' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.payment.cashEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Enabled</span>
                  </label>
                </div>
                <Field label="Cash payment instructions" hint="Shown to users on the payment form.">
                  <textarea className="input-field" rows={2} value={settings.payment.cashInstructions}
                    onChange={(e) => updatePayment({ cashInstructions: e.target.value })} />
                </Field>
              </Card>

              {/* Flutterwave */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-black text-sm">Fw</div>
                    <SectionTitle>Flutterwave</SectionTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500">
                      <input type="checkbox" checked={settings.payment.flutterwaveTestMode}
                        onChange={(e) => updatePayment({ flutterwaveTestMode: e.target.checked })}
                        className="h-3.5 w-3.5 rounded" />
                      Test mode
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => updatePayment({ flutterwaveEnabled: !settings.payment.flutterwaveEnabled })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${settings.payment.flutterwaveEnabled ? 'bg-slate-950' : 'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.payment.flutterwaveEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Enabled</span>
                    </label>
                  </div>
                </div>
                {settings.payment.flutterwaveTestMode && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    ⚠️ Test mode is active. No real charges will be made. Switch to live before going live.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Public key">
                    <input className="input-field font-mono text-xs" placeholder="FLWPUBK_TEST-..." value={settings.payment.flutterwavePublicKey}
                      onChange={(e) => updatePayment({ flutterwavePublicKey: e.target.value })} />
                  </Field>
                  <Field label="Secret key">
                    <input type="password" className="input-field font-mono text-xs" placeholder="FLWSECK_TEST-..." value={settings.payment.flutterwaveSecretKey}
                      onChange={(e) => updatePayment({ flutterwaveSecretKey: e.target.value })} />
                  </Field>
                  <Field label="Encryption key">
                    <input type="password" className="input-field font-mono text-xs" placeholder="Encryption key..." value={settings.payment.flutterwaveEncryptionKey}
                      onChange={(e) => updatePayment({ flutterwaveEncryptionKey: e.target.value })} />
                  </Field>
                </div>
              </Card>

              {/* Mobile Money */}
              <Card>
                <SectionTitle>Mobile money — Liberia GSM networks</SectionTitle>
                <p className="mb-4 text-xs text-slate-400">Configure both Liberian GSM mobile money providers. These appear as payment options when mobile money is selected.</p>
                <div className="space-y-5">
                  {settings.payment.mobileMoneyProviders.map((provider, i) => (
                    <div key={provider.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold ${provider.id === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                            {provider.id === 'orange' ? 'OM' : 'MT'}
                          </div>
                          <span className="font-semibold text-slate-900">{provider.name}</span>
                          <span className="text-xs text-slate-400">{provider.network}</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div onClick={() => {
                            const providers = [...settings.payment.mobileMoneyProviders];
                            providers[i] = { ...providers[i], enabled: !providers[i].enabled };
                            updatePayment({ mobileMoneyProviders: providers });
                          }} className={`relative h-5 w-9 rounded-full transition-colors ${provider.enabled ? 'bg-slate-950' : 'bg-slate-300'}`}>
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${provider.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Merchant / Till number">
                          <input className="input-field" placeholder="e.g. 0777123456" value={provider.merchantNumber}
                            onChange={(e) => {
                              const providers = [...settings.payment.mobileMoneyProviders];
                              providers[i] = { ...providers[i], merchantNumber: e.target.value };
                              updatePayment({ mobileMoneyProviders: providers });
                            }} />
                        </Field>
                        <Field label="Merchant / Business name">
                          <input className="input-field" placeholder="Name shown on transfer" value={provider.merchantName}
                            onChange={(e) => {
                              const providers = [...settings.payment.mobileMoneyProviders];
                              providers[i] = { ...providers[i], merchantName: e.target.value };
                              updatePayment({ mobileMoneyProviders: providers });
                            }} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Bank Transfer */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle>Bank transfer accounts</SectionTitle>
                  <button onClick={() => {
                    const accounts = [...settings.payment.bankAccounts, {
                      id: Date.now().toString(), bankName: '', accountName: '', accountNumber: '',
                      routingCode: '', swiftCode: '', branch: '', enabled: true
                    }];
                    updatePayment({ bankAccounts: accounts });
                  }} className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700">
                    + Add bank account
                  </button>
                </div>
                <div className="space-y-5">
                  {settings.payment.bankAccounts.map((account, i) => (
                    <div key={account.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">BK</div>
                          <span className="font-semibold text-slate-900">{account.bankName || `Bank account ${i + 1}`}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div onClick={() => {
                              const accounts = [...settings.payment.bankAccounts];
                              accounts[i] = { ...accounts[i], enabled: !accounts[i].enabled };
                              updatePayment({ bankAccounts: accounts });
                            }} className={`relative h-5 w-9 rounded-full transition-colors ${account.enabled ? 'bg-slate-950' : 'bg-slate-300'}`}>
                              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${account.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </div>
                          </label>
                          {settings.payment.bankAccounts.length > 1 && (
                            <button onClick={() => updatePayment({ bankAccounts: settings.payment.bankAccounts.filter((_, j) => j !== i) })}
                              className="text-xs text-rose-500 hover:text-rose-700">Remove</button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {([
                          ['bankName', 'Bank name', 'e.g. Ecobank Liberia'],
                          ['accountName', 'Account name', 'e.g. SICSS School Fund'],
                          ['accountNumber', 'Account number', ''],
                          ['branch', 'Branch', 'e.g. Gbarnga Branch'],
                          ['routingCode', 'Routing / sort code', ''],
                          ['swiftCode', 'SWIFT / BIC code', ''],
                        ] as [keyof BankAccount, string, string][]).map(([key, label, placeholder]) => (
                          <Field key={key} label={label}>
                            <input className="input-field" placeholder={placeholder} value={account[key] as string}
                              onChange={(e) => {
                                const accounts = [...settings.payment.bankAccounts];
                                accounts[i] = { ...accounts[i], [key]: e.target.value };
                                updatePayment({ bankAccounts: accounts });
                              }} />
                          </Field>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Invoice settings */}
              <Card>
                <SectionTitle>Invoice settings</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Invoice number prefix" hint="e.g. INV → INV-2026-0001">
                    <input className="input-field" value={settings.payment.invoicePrefix}
                      onChange={(e) => updatePayment({ invoicePrefix: e.target.value })} />
                  </Field>
                  <Field label="Due in (days)">
                    <input type="number" min="0" className="input-field" value={settings.payment.invoiceDueDays}
                      onChange={(e) => updatePayment({ invoiceDueDays: Number(e.target.value) })} />
                  </Field>
                  <div className="flex items-center gap-3 pt-4">
                    <input type="checkbox" id="show_tax" checked={settings.payment.showInvoiceTax}
                      onChange={(e) => updatePayment({ showInvoiceTax: e.target.checked })}
                      className="h-4 w-4 rounded" />
                    <label htmlFor="show_tax" className="text-sm font-medium text-slate-700">Show tax line on invoice</label>
                  </div>
                  {settings.payment.showInvoiceTax && <>
                    <Field label="Tax label">
                      <input className="input-field" value={settings.payment.taxLabel}
                        onChange={(e) => updatePayment({ taxLabel: e.target.value })} />
                    </Field>
                    <Field label="Tax rate (%)">
                      <input type="number" min="0" max="100" step="0.1" className="input-field" value={settings.payment.taxRate}
                        onChange={(e) => updatePayment({ taxRate: Number(e.target.value) })} />
                    </Field>
                  </>}
                  <div className="sm:col-span-2">
                    <Field label="Payment terms">
                      <textarea className="input-field" rows={2} value={settings.payment.invoiceTerms}
                        onChange={(e) => updatePayment({ invoiceTerms: e.target.value })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Invoice footer note">
                      <textarea className="input-field" rows={2} value={settings.payment.invoiceFooterNote}
                        onChange={(e) => updatePayment({ invoiceFooterNote: e.target.value })} />
                    </Field>
                  </div>
                </div>
              </Card>

              {/* Receipt settings */}
              <Card>
                <SectionTitle>Receipt settings</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Receipt number prefix" hint="e.g. RCP → RCP-20260001">
                    <input className="input-field" value={settings.payment.receiptPrefix}
                      onChange={(e) => updatePayment({ receiptPrefix: e.target.value })} />
                  </Field>
                  <div className="flex items-center gap-3 pt-5">
                    <input type="checkbox" id="require_proof" checked={settings.payment.requirePaymentProof}
                      onChange={(e) => updatePayment({ requirePaymentProof: e.target.checked })}
                      className="h-4 w-4 rounded" />
                    <label htmlFor="require_proof" className="text-sm font-medium text-slate-700">Require proof-of-payment upload</label>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Receipt footer note">
                      <textarea className="input-field" rows={2} value={settings.payment.receiptFooterNote}
                        onChange={(e) => updatePayment({ receiptFooterNote: e.target.value })} />
                    </Field>
                  </div>
                </div>
              </Card>

              <button onClick={() => save(() => {})} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
                Save payment settings
              </button>
            </div>
          )}

          {/* ── REPORT CARD ── */}          {activeTab === 'reportcard' && (
            <div className="space-y-5">
              <Card>
                <SectionTitle>Layout & theme</SectionTitle>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Grade sheet title">
                    <input className="input-field" value={settings.reportCard.gradeTitle}
                      onChange={(e) => updateReportCard({ gradeTitle: e.target.value })} />
                  </Field>
                  <Field label="Page orientation">
                    <select className="input-field" value={settings.reportCard.layout}
                      onChange={(e) => updateReportCard({ layout: e.target.value as any })}>
                      <option value="landscape">Landscape (A4)</option>
                      <option value="portrait">Portrait (A4)</option>
                    </select>
                  </Field>
                  <Field label="Visual theme">
                    <select className="input-field" value={settings.reportCard.theme}
                      onChange={(e) => updateReportCard({ theme: e.target.value as any })}>
                      <option value="classic">Classic — traditional bordered table</option>
                      <option value="modern">Modern — clean with accent header</option>
                      <option value="minimal">Minimal — plain, printer-friendly</option>
                    </select>
                  </Field>
                  <Field label="Font family">
                    <select className="input-field" value={settings.reportCard.fontFamily}
                      onChange={(e) => updateReportCard({ fontFamily: e.target.value as any })}>
                      <option value="sans">Sans-serif (clean)</option>
                      <option value="serif">Serif (traditional)</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </Field>
                  <Field label="Body font size">
                    <select className="input-field" value={settings.reportCard.fontSize}
                      onChange={(e) => updateReportCard({ fontSize: e.target.value as any })}>
                      <option value="xs">Extra small (fit more subjects)</option>
                      <option value="sm">Small</option>
                      <option value="base">Normal</option>
                    </select>
                  </Field>
                </div>
              </Card>

              <Card>
                <SectionTitle>Header colors</SectionTitle>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Field label="Header background">
                    <div className="flex items-center gap-2">
                      <input type="color" value={settings.reportCard.headerBgColor}
                        onChange={(e) => updateReportCard({ headerBgColor: e.target.value })}
                        className="h-10 w-16 cursor-pointer rounded border border-slate-200" />
                      <span className="text-sm text-slate-600 font-mono">{settings.reportCard.headerBgColor}</span>
                    </div>
                  </Field>
                  <Field label="Header text">
                    <div className="flex items-center gap-2">
                      <input type="color" value={settings.reportCard.headerTextColor}
                        onChange={(e) => updateReportCard({ headerTextColor: e.target.value })}
                        className="h-10 w-16 cursor-pointer rounded border border-slate-200" />
                      <span className="text-sm text-slate-600 font-mono">{settings.reportCard.headerTextColor}</span>
                    </div>
                  </Field>
                  <Field label="Table border color">
                    <div className="flex items-center gap-2">
                      <input type="color" value={settings.reportCard.borderColor}
                        onChange={(e) => updateReportCard({ borderColor: e.target.value })}
                        className="h-10 w-16 cursor-pointer rounded border border-slate-200" />
                      <span className="text-sm text-slate-600 font-mono">{settings.reportCard.borderColor}</span>
                    </div>
                  </Field>
                </div>

                {/* Color preview */}
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <div className="px-4 py-3 text-center" style={{ backgroundColor: settings.reportCard.headerBgColor, color: settings.reportCard.headerTextColor }}>
                    <p className="font-bold">{settings.branding.schoolName}</p>
                    <p className="text-xs opacity-80">{settings.branding.schoolSubtitle}</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead><tr style={{ borderBottom: `2px solid ${settings.reportCard.borderColor}` }}>
                      <th className="p-2 text-left">Subject</th><th className="p-2">Exam</th><th className="p-2">Average</th>
                    </tr></thead>
                    <tbody>
                      {['Mathematics', 'English'].map((s) => (
                        <tr key={s} style={{ borderBottom: `1px solid ${settings.reportCard.borderColor}` }}>
                          <td className="p-2">{s}</td>
                          <td className="p-2 text-center" style={{ color: '#2563eb', fontWeight: 700 }}>85</td>
                          <td className="p-2 text-center" style={{ color: '#dc2626', fontWeight: 700 }}>62</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <SectionTitle>Score color coding</SectionTitle>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.reportCard.showBelowPassRed}
                        onChange={(e) => updateReportCard({ showBelowPassRed: e.target.checked })}
                        className="h-4 w-4 rounded" />
                      <span className="text-sm font-medium text-slate-700">Scores below pass threshold — <span className="text-red-600 font-bold">red</span></span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.reportCard.showAbovePassBlue}
                        onChange={(e) => updateReportCard({ showAbovePassBlue: e.target.checked })}
                        className="h-4 w-4 rounded" />
                      <span className="text-sm font-medium text-slate-700">Scores at/above threshold — <span className="text-blue-600 font-bold">blue</span></span>
                    </label>
                  </div>
                  <Field label="Pass threshold (default 70)" hint="Scores below this value are marked failing.">
                    <input type="number" min="0" max="100" className="input-field max-w-[120px]"
                      value={settings.reportCard.passThreshold}
                      onChange={(e) => updateReportCard({ passThreshold: Number(e.target.value) })} />
                  </Field>
                </div>
              </Card>

              <Card>
                <SectionTitle>Grading scale</SectionTitle>
                <p className="mb-4 text-xs text-slate-400">These appear in the footer of every printed report card.</p>
                <div className="space-y-3">
                  {settings.reportCard.gradingScale.map((g, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold text-slate-700">{g.label}</span>
                      <input type="number" min="0" max="100" placeholder="Min" value={g.min}
                        onChange={(e) => {
                          const scale = [...settings.reportCard.gradingScale];
                          scale[i] = { ...scale[i], min: Number(e.target.value) };
                          updateReportCard({ gradingScale: scale });
                        }}
                        className="input-field w-20" />
                      <span className="text-slate-400">–</span>
                      <input type="number" min="0" max="100" placeholder="Max" value={g.max}
                        onChange={(e) => {
                          const scale = [...settings.reportCard.gradingScale];
                          scale[i] = { ...scale[i], max: Number(e.target.value) };
                          updateReportCard({ gradingScale: scale });
                        }}
                        className="input-field w-20" />
                      <input placeholder="Label (e.g. Excellent)" value={g.description}
                        onChange={(e) => {
                          const scale = [...settings.reportCard.gradingScale];
                          scale[i] = { ...scale[i], description: e.target.value };
                          updateReportCard({ gradingScale: scale });
                        }}
                        className="input-field flex-1 min-w-[120px]" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionTitle>Periods / columns</SectionTitle>
                <p className="mb-4 text-xs text-slate-400">Each entry becomes a column header in the subject marks table.</p>
                <div className="space-y-2">
                  {settings.reportCard.customPeriods.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs text-slate-400">{i + 1}</span>
                      <input value={p}
                        onChange={(e) => {
                          const periods = [...settings.reportCard.customPeriods];
                          periods[i] = e.target.value;
                          updateReportCard({ customPeriods: periods });
                        }}
                        className="input-field flex-1" />
                      <button onClick={() => {
                        const periods = settings.reportCard.customPeriods.filter((_, j) => j !== i);
                        updateReportCard({ customPeriods: periods });
                      }} className="text-sm text-rose-500 hover:text-rose-700 px-1">✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => updateReportCard({ customPeriods: [...settings.reportCard.customPeriods, ''] })}
                  className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700"
                >
                  + Add period / column
                </button>
              </Card>

              <Card>
                <SectionTitle>Signature lines</SectionTitle>
                <div className="space-y-2">
                  {settings.reportCard.signatories.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={s}
                        onChange={(e) => {
                          const sigs = [...settings.reportCard.signatories];
                          sigs[i] = e.target.value;
                          updateReportCard({ signatories: sigs });
                        }}
                        className="input-field flex-1" />
                      <button onClick={() => {
                        const sigs = settings.reportCard.signatories.filter((_, j) => j !== i);
                        updateReportCard({ signatories: sigs });
                      }} className="text-sm text-rose-500 hover:text-rose-700 px-1">✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => updateReportCard({ signatories: [...settings.reportCard.signatories, ''] })}
                  className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-cyan-400 hover:text-cyan-700"
                >
                  + Add signatory
                </button>
              </Card>

              <Card>
                <SectionTitle>Sections to show</SectionTitle>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    ['showLogo', 'School logo'],
                    ['showMotto', 'School motto'],
                    ['showAddress', 'School address'],
                    ['showAggregate', 'Aggregate / Average / Rank row'],
                    ['showConduct', 'Conduct field'],
                    ['showRank', 'Rank field'],
                    ['showPromotionStatement', 'Promotion statement'],
                  ] as [keyof typeof settings.reportCard, string][]).map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox"
                        checked={settings.reportCard[key] as boolean}
                        onChange={(e) => updateReportCard({ [key]: e.target.checked })}
                        className="h-4 w-4 rounded" />
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionTitle>Footer note</SectionTitle>
                <textarea className="input-field" rows={3}
                  placeholder="Optional note printed at the bottom of each report card…"
                  value={settings.reportCard.footerNote}
                  onChange={(e) => updateReportCard({ footerNote: e.target.value })} />
              </Card>

              <button onClick={() => save(() => {})} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
                Save report card settings
              </button>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {activeTab === 'system' && (
            <Card>
              <SectionTitle>System settings</SectionTitle>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="System short name" hint="Shown in the browser tab and header.">
                  <input className="input-field" value={settings.system.systemName}
                    onChange={(e) => updateSystem({ systemName: e.target.value })} />
                </Field>
                <Field label="Current academic year">
                  <input className="input-field" value={settings.system.academicYear}
                    onChange={(e) => updateSystem({ academicYear: e.target.value })} />
                </Field>
                <Field label="Country">
                  <input className="input-field" value={settings.system.country}
                    onChange={(e) => updateSystem({ country: e.target.value })} />
                </Field>
                <Field label="Default currency">
                  <select className="input-field" value={settings.system.currency}
                    onChange={(e) => updateSystem({ currency: e.target.value as any })}>
                    <option value="LRD">LRD — Liberian Dollar</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                </Field>
                <Field label="Date format">
                  <select className="input-field" value={settings.system.dateFormat}
                    onChange={(e) => updateSystem({ dateFormat: e.target.value as any })}>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </Field>
                <Field label="Timezone">
                  <input className="input-field" value={settings.system.timezone}
                    onChange={(e) => updateSystem({ timezone: e.target.value })} />
                </Field>
              </div>
              <button onClick={() => save(() => {})} className="mt-6 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
                Save system settings
              </button>
            </Card>
          )}

          {/* ── RESET ── */}
          {activeTab === 'reset' && (
            <Card>
              <div className="mx-auto max-w-lg text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl">🔄</div>
                <h2 className="text-xl font-bold text-slate-950">Reset to factory defaults</h2>
                <p className="mt-3 text-sm text-slate-500">
                  This will wipe all customizations — branding, colors, typography, layout, and report card settings — and restore the system to its original SICSS configuration. Use this when delivering the system to a new client.
                </p>
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  ⚠️ This cannot be undone. All custom colors, logos, and settings will be permanently lost.
                </div>
                {!resetConfirm ? (
                  <button onClick={() => setResetConfirm(true)} className="mt-6 rounded-lg border-2 border-rose-300 px-6 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                    Reset all settings
                  </button>
                ) : (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-semibold text-rose-700">Are you absolutely sure?</p>
                    <div className="flex justify-center gap-3">
                      <button onClick={() => setResetConfirm(false)} className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                      <button
                        onClick={() => { resetAll(); setResetConfirm(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                        className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                      >
                        Yes, reset everything
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
