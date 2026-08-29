import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccentColor = 'cyan' | 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'orange' | 'teal';
export type SidebarStyle = 'dark' | 'light' | 'colored';
export type FontSize = 'compact' | 'normal' | 'large';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export type ReportCardLayout = 'landscape' | 'portrait';
export type ReportCardTheme = 'classic' | 'modern' | 'minimal';

export interface BrandingSettings {
  schoolName: string;
  schoolSubtitle: string;
  schoolMotto: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  logoUrl: string; // base64 or URL
}

export interface ThemeSettings {
  accentColor: AccentColor;
  sidebarStyle: SidebarStyle;
  fontSize: FontSize;
  density: LayoutDensity;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  showIcons: boolean;
}

export interface ReportCardSettings {
  layout: ReportCardLayout;
  theme: ReportCardTheme;
  showLogo: boolean;
  showMotto: boolean;
  showAddress: boolean;
  headerBgColor: string;
  headerTextColor: string;
  accentColor: string;
  borderColor: string;
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSize: 'xs' | 'sm' | 'base';
  showBelowPassRed: boolean;
  showAbovePassBlue: boolean;
  passThreshold: number;
  gradeTitle: string;
  gradingScale: { min: number; max: number; label: string; description: string }[];
  signatories: string[];
  showAggregate: boolean;
  showRank: boolean;
  showConduct: boolean;
  showPromotionStatement: boolean;
  footerNote: string;
  customPeriods: string[];
}

export interface SystemSettings {
  systemName: string;
  academicYear: string;
  country: string;
  currency: 'LRD' | 'USD';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timezone: string;
}

export interface MobileMoneyProvider {
  id: string;
  name: string;          // e.g. "Orange Money"
  network: string;       // e.g. "Orange Liberia"
  merchantNumber: string;
  merchantName: string;
  enabled: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingCode: string;
  swiftCode: string;
  branch: string;
  enabled: boolean;
}

export interface PaymentSettings {
  // Cash
  cashEnabled: boolean;
  cashInstructions: string;

  // Flutterwave
  flutterwaveEnabled: boolean;
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  flutterwaveEncryptionKey: string;
  flutterwaveLogo: string;
  flutterwaveTestMode: boolean;

  // Mobile Money (multiple providers — both Liberian GSM networks)
  mobileMoneyProviders: MobileMoneyProvider[];

  // Bank Transfer (multiple accounts)
  bankAccounts: BankAccount[];

  // Invoice settings
  invoicePrefix: string;
  invoiceFooterNote: string;
  invoiceDueDays: number;
  showInvoiceTax: boolean;
  taxLabel: string;
  taxRate: number;       // percentage
  invoiceTerms: string;

  // Receipt settings
  receiptPrefix: string;
  receiptFooterNote: string;
  requirePaymentProof: boolean;
}

export interface AppSettings {
  branding: BrandingSettings;
  theme: ThemeSettings;
  reportCard: ReportCardSettings;
  system: SystemSettings;
  payment: PaymentSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  branding: {
    schoolName: 'Salvation In Christ School System',
    schoolSubtitle: 'Elem. & Semi Junior High | Bong County - Liberia',
    schoolMotto: 'Equipping For a Better Future',
    schoolAddress: 'Bong County, Liberia',
    schoolPhone: '',
    schoolEmail: '',
    schoolWebsite: '',
    logoUrl: '',
  },
  theme: {
    accentColor: 'cyan',
    sidebarStyle: 'dark',
    fontSize: 'normal',
    density: 'comfortable',
    borderRadius: 'rounded',
    showIcons: true,
  },
  reportCard: {
    layout: 'landscape',
    theme: 'classic',
    showLogo: true,
    showMotto: true,
    showAddress: true,
    headerBgColor: '#0f172a',
    headerTextColor: '#ffffff',
    accentColor: '#0891b2',
    borderColor: '#94a3b8',
    fontFamily: 'sans',
    fontSize: 'xs',
    showBelowPassRed: true,
    showAbovePassBlue: true,
    passThreshold: 70,
    gradeTitle: 'Report Card',
    gradingScale: [
      { min: 90, max: 100, label: 'A', description: 'Excellent' },
      { min: 80, max: 89, label: 'B', description: 'Good' },
      { min: 70, max: 79, label: 'C', description: 'Fair' },
      { min: 0, max: 69, label: 'D', description: 'Fail' },
    ],
    signatories: ['Teacher', 'Parent / Guardian', 'Principal'],
    showAggregate: true,
    showRank: true,
    showConduct: true,
    showPromotionStatement: true,
    footerNote: '',
    customPeriods: ['1st semester', '2nd semester', '1st period', '2nd period', '3rd period', '4th period', '5th period', '6th period', 'Exam', 'Yearly average'],
  },
  system: {
    systemName: 'SICSS',
    academicYear: '2026',
    country: 'Liberia',
    currency: 'LRD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'Africa/Monrovia',
  },
  payment: {
    cashEnabled: true,
    cashInstructions: 'Pay directly to the school finance office. Keep your receipt.',

    flutterwaveEnabled: false,
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    flutterwaveEncryptionKey: '',
    flutterwaveLogo: '',
    flutterwaveTestMode: true,

    mobileMoneyProviders: [
      {
        id: 'orange',
        name: 'Orange Money',
        network: 'Orange Liberia',
        merchantNumber: '',
        merchantName: '',
        enabled: true,
      },
      {
        id: 'lonestar',
        name: 'Lonestar MTN Mobile Money',
        network: 'Lonestar Cell / MTN Liberia',
        merchantNumber: '',
        merchantName: '',
        enabled: true,
      },
    ],

    bankAccounts: [
      {
        id: 'default',
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingCode: '',
        swiftCode: '',
        branch: '',
        enabled: true,
      },
    ],

    invoicePrefix: 'INV',
    invoiceFooterNote: 'Thank you for your payment. Please retain this invoice for your records.',
    invoiceDueDays: 30,
    showInvoiceTax: false,
    taxLabel: 'Tax',
    taxRate: 0,
    invoiceTerms: 'Payment is due within 30 days of invoice date.',

    receiptPrefix: 'RCP',
    receiptFooterNote: 'This receipt is your proof of payment. Keep it safe.',
    requirePaymentProof: false,
  },
};

interface SettingsState {
  settings: AppSettings;
  updateBranding: (b: Partial<BrandingSettings>) => void;
  updateTheme: (t: Partial<ThemeSettings>) => void;
  updateReportCard: (r: Partial<ReportCardSettings>) => void;
  updateSystem: (s: Partial<SystemSettings>) => void;
  updatePayment: (p: Partial<PaymentSettings>) => void;
  resetAll: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateBranding: (b) =>
        set((state) => ({
          settings: { ...state.settings, branding: { ...state.settings.branding, ...b } },
        })),
      updateTheme: (t) =>
        set((state) => ({
          settings: { ...state.settings, theme: { ...state.settings.theme, ...t } },
        })),
      updateReportCard: (r) =>
        set((state) => ({
          settings: { ...state.settings, reportCard: { ...state.settings.reportCard, ...r } },
        })),
      updateSystem: (s) =>
        set((state) => ({
          settings: { ...state.settings, system: { ...state.settings.system, ...s } },
        })),
      updatePayment: (p) =>
        set((state) => ({
          settings: { ...state.settings, payment: { ...state.settings.payment, ...p } },
        })),
      resetAll: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'sicss-settings',
      // Deep-merge persisted data with defaults so new keys (like `payment`)
      // are always present even when loading an older saved state.
      merge: (persisted: unknown, current: SettingsState): SettingsState => {
        const p = (persisted as Partial<SettingsState>) ?? {};
        const stored = (p.settings ?? {}) as Partial<AppSettings>;
        return {
          ...current,
          settings: {
            branding:   { ...DEFAULT_SETTINGS.branding,   ...(stored.branding   ?? {}) },
            theme:      { ...DEFAULT_SETTINGS.theme,      ...(stored.theme      ?? {}) },
            reportCard: { ...DEFAULT_SETTINGS.reportCard, ...(stored.reportCard ?? {}) },
            system:     { ...DEFAULT_SETTINGS.system,     ...(stored.system     ?? {}) },
            payment:    { ...DEFAULT_SETTINGS.payment,    ...(stored.payment    ?? {}) },
          },
        };
      },
    }
  )
);

export { DEFAULT_SETTINGS };
