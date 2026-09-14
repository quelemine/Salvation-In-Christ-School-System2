import { useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
  userId: number;
  email: string;
  phone?: string;
  countryCode?: string;
  initialDevMode?: boolean;
  initialOtpCode?: string;
  initialDeliveryMethod?: 'email' | 'sms' | 'whatsapp';
}

export default function OtpModal({ isOpen, onClose, onSuccess, userId, email, phone = '', countryCode = '+231', initialDevMode = false, initialOtpCode = '', initialDeliveryMethod = 'email' }: OtpModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('otp');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms' | 'whatsapp'>(initialDeliveryMethod);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const countries = [
    { code: '+1', name: 'United States', flag: '🇺🇸' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '+231', name: 'Liberia', flag: '🇱🇷' },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', name: 'Kenya', flag: '🇰🇪' },
    { code: '+27', name: 'South Africa', flag: '🇿🇦' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+39', name: 'Italy', flag: '🇮🇹' },
    { code: '+34', name: 'Spain', flag: '🇪🇸' },
    { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
    { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
    { code: '+46', name: 'Sweden', flag: '🇸🇪' },
    { code: '+47', name: 'Norway', flag: '🇳🇴' },
    { code: '+45', name: 'Denmark', flag: '🇩🇰' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹' },
    { code: '+358', name: 'Finland', flag: '🇫🇮' },
    { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
    { code: '+375', name: 'Belarus', flag: '🇧🇾' },
    { code: '+371', name: 'Latvia', flag: '🇱🇻' },
    { code: '+370', name: 'Lithuania', flag: '🇱🇹' },
    { code: '+372', name: 'Estonia', flag: '🇪🇪' },
    { code: '+48', name: 'Poland', flag: '🇵🇱' },
    { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
    { code: '+421', name: 'Slovakia', flag: '🇸🇰' },
    { code: '+43', name: 'Austria', flag: '🇦🇹' },
    { code: '+36', name: 'Hungary', flag: '🇭🇺' },
    { code: '+40', name: 'Romania', flag: '🇷🇴' },
    { code: '+381', name: 'Serbia', flag: '🇷🇸' },
    { code: '+385', name: 'Croatia', flag: '🇭🇷' },
    { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
    { code: '+387', name: 'Bosnia', flag: '🇧🇦' },
    { code: '+389', name: 'North Macedonia', flag: '🇲🇰' },
    { code: '+359', name: 'Bulgaria', flag: '🇧🇬' },
    { code: '+30', name: 'Greece', flag: '🇬🇷' },
    { code: '+90', name: 'Turkey', flag: '🇹🇷' },
    { code: '+355', name: 'Albania', flag: '🇦🇱' },
    { code: '+356', name: 'Malta', flag: '🇲🇹' },
    { code: '+357', name: 'Cyprus', flag: '🇨🇾' },
    { code: '+972', name: 'Israel', flag: '🇮🇱' },
    { code: '+964', name: 'Iraq', flag: '🇮🇶' },
    { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', name: 'Oman', flag: '🴏' },
    { code: '+20', name: 'Egypt', flag: '🇪🇬' },
    { code: '+213', name: 'Algeria', flag: '🇩🇿' },
    { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
    { code: '+212', name: 'Morocco', flag: '🇲🇦' },
    { code: '+218', name: 'Libya', flag: '🇱🇾' },
    { code: '+222', name: 'Mauritania', flag: '🇲🇷' },
    { code: '+221', name: 'Senegal', flag: '🇸🇳' },
    { code: '+224', name: 'Guinea', flag: '🇬🇳' },
    { code: '+225', name: 'Ivory Coast', flag: '🇨🇮' },
    { code: '+228', name: 'Togo', flag: '🇹🇬' },
    { code: '+229', name: 'Benin', flag: '🇧🇯' },
    { code: '+233', name: 'Ghana', flag: '🇬🇭' },
    { code: '+235', name: 'Cameroon', flag: '🇨🇲' },
    { code: '+240', name: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: '+241', name: 'Gabon', flag: '🇬🇦' },
    { code: '+242', name: 'Congo', flag: '🇨🇬' },
    { code: '+243', name: 'DR Congo', flag: '🇨🇩' },
    { code: '+244', name: 'Angola', flag: '🇦🇴' },
    { code: '+245', name: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: '+246', name: 'Gambia', flag: '🇬🇲' },
    { code: '+248', name: 'Cape Verde', flag: '🇨🇻' },
    { code: '+250', name: 'Rwanda', flag: '🇷🇼' },
    { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
    { code: '+252', name: 'Somalia', flag: '🇸🇴' },
    { code: '+253', name: 'Djibouti', flag: '🇩🇯' },
    { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
    { code: '+256', name: 'Uganda', flag: '🇺🇬' },
    { code: '+257', name: 'Burundi', flag: '🇧🇮' },
    { code: '+258', name: 'Mozambique', flag: '🇲🇿' },
    { code: '+260', name: 'Zambia', flag: '🇿🇲' },
    { code: '+261', name: 'Madagascar', flag: '🇲🇬' },
    { code: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
    { code: '+264', name: 'Namibia', flag: '🇳🇦' },
    { code: '+265', name: 'Malawi', flag: '🇲🇼' },
    { code: '+266', name: 'Lesotho', flag: '🇱🇸' },
    { code: '+267', name: 'Botswana', flag: '🇧🇼' },
    { code: '+268', name: 'Eswatini', flag: '🇸🇿' },
    { code: '+501', name: 'Belize', flag: '🇧🇿' },
    { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
    { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
    { code: '+504', name: 'Honduras', flag: '🇭🇳' },
    { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
    { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', name: 'Panama', flag: '🇵🇦' },
    { code: '+508', name: 'Dominican Republic', flag: '🇩🇴' },
    { code: '+509', name: 'Haiti', flag: '🇭🇹' },
    { code: '+51', name: 'Peru', flag: '🇵🇪' },
    { code: '+52', name: 'Mexico', flag: '🇲🇽' },
    { code: '+53', name: 'Cuba', flag: '🇨🇺' },
    { code: '+55', name: 'Brazil', flag: '🇧🇷' },
    { code: '+56', name: 'Chile', flag: '🇨🇱' },
    { code: '+57', name: 'Colombia', flag: '🇨🇴' },
    { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
    { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
    { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
    { code: '+594', name: 'Guyana', flag: '🇬🇾' },
    { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
    { code: '+598', name: 'Falkland Islands', flag: '🇫🇾' },
    { code: '+599', name: 'Netherlands Antilles', flag: '🇳🇱' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
    { code: '+63', name: 'Philippines', flag: '🇵🇭' },
    { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+66', name: 'Thailand', flag: '🇹🇭' },
    { code: '+673', name: 'Brunei', flag: '🇧🇳' },
    { code: '+674', name: 'Nauru', flag: '🇳🇷' },
    { code: '+675', name: 'Papua New Guinea', flag: '🇵🇬' },
    { code: '+676', name: 'Solomon Islands', flag: '🇼🇸' },
    { code: '+677', name: 'Fiji', flag: '🇫🇯' },
    { code: '+678', name: 'Vanuatu', flag: '🇻🇺' },
    { code: '+679', name: 'Tonga', flag: '🇹🇴' },
    { code: '+680', name: 'Palau', flag: '🇵🇫' },
    { code: '+681', name: 'Wallis & Futuna', flag: '🇼🇫' },
    { code: '+682', name: 'Cook Islands', flag: '🇨🇰' },
    { code: '+683', name: 'Niue', flag: '🇳🇺' },
    { code: '+684', name: 'Kiribati', flag: '🇰🇮' },
    { code: '+685', name: 'Tuvalu', flag: '🇹🇻' },
    { code: '+686', name: 'Samoa', flag: '🇼🇸' },
    { code: '+687', name: 'Tokelau', flag: '🇹🇰' },
    { code: '+688', name: 'New Zealand', flag: '🇳🇿' },
    { code: '+689', name: 'Tokelau', flag: '🇹🇰' },
    { code: '+690', name: 'Tokelau', flag: '🇹🇰' },
    { code: '+691', name: 'Micronesia', flag: '🇫🇲' },
    { code: '+692', name: 'Marshall Islands', flag: '🇲🇭' },
    { code: '+850', name: 'North Korea', flag: '🇰🇵' },
    { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
    { code: '+853', name: 'Macau', flag: '🇲🇴' },
    { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
    { code: '+856', name: 'Laos', flag: '🇱🇦' },
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
    { code: '+886', name: 'Taiwan', flag: '🇹🇼' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
    { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
    { code: '+960', name: 'Maldives', flag: '🇲🇻' },
    { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
    { code: '+962', name: 'Jordan', flag: '🇯🇴' },
    { code: '+963', name: 'Syria', flag: '🇸🇾' },
    { code: '+967', name: 'Yemen', flag: '🇾🇪' },
    { code: '+970', name: 'Palestine', flag: '��🇸' },
    { code: '+975', name: 'Bhutan', flag: '🇧🇹' },
    { code: '+976', name: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: '+977', name: 'Nepal', flag: '🇳🇵' },
    { code: '+98', name: 'Iran', flag: '🇮🇷' },
    { code: '+992', name: 'Tajikistan', flag: '🇹🇯' },
    { code: '+993', name: 'Turkmenistan', flag: '🇹🇲' },
    { code: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
    { code: '+995', name: 'Georgia', flag: '🇬🇪' },
    { code: '+996', name: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
  ];

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.includes(countrySearch)
  );

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setError('');
      setResendTimer(0);
      setDevOtpCode('');
      setDevMode(false);
      inputRefs.current = [];
    } else {
      // Initialize dev mode when modal opens
      setDevMode(initialDevMode);
      setDevOtpCode(initialOtpCode);
    }
  }, [isOpen, initialDevMode, initialOtpCode]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCountryDropdown && !(event.target as Element).closest('.country-selector')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryDropdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSendCode = async () => {
    if ((deliveryMethod === 'sms' || deliveryMethod === 'whatsapp') && !phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.resendOtp(userId, deliveryMethod, selectedCountryCode, phoneNumber);
      if (response.otp_code) {
        setDevOtpCode(response.otp_code);
        setDevMode(true);
      }
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.verifyOtp(userId, code);
      onSuccess(response.user, response.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      const response = await authService.resendOtp(userId, deliveryMethod, selectedCountryCode, phoneNumber);
      if (response.otp_code) {
        setDevOtpCode(response.otp_code);
        setDevMode(true);
      }
      setResendTimer(60);
      setError('New code sent');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <>
            {/* Illustration */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-20 blur-xl" />
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center shadow-lg ring-4 ring-white">
                  <span className="text-4xl">📱</span>
                </div>
              </div>
            </div>

            {/* Delivery Method Tabs */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1.5">
              <button
                onClick={() => setDeliveryMethod('email')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  deliveryMethod === 'email' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
              <button
                onClick={() => setDeliveryMethod('sms')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  deliveryMethod === 'sms' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                SMS
              </button>
              <button
                onClick={() => setDeliveryMethod('whatsapp')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  deliveryMethod === 'whatsapp' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              {deliveryMethod === 'email' ? 'Send to Email' : 'Enter Phone Number'}
            </h2>
            <p className="mb-6 text-sm text-slate-500 leading-relaxed">
              {deliveryMethod === 'email' 
                ? `We will send a verification code to ${email}`
                : 'We will send a verification code to your phone number'
              }
            </p>

          {(deliveryMethod === 'sms' || deliveryMethod === 'whatsapp') && (
            <div className="mb-6">
              <div className="flex gap-3 country-selector">
                {/* Country Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{countries.find(c => c.code === selectedCountryCode)?.flag}</span>
                      <span>{selectedCountryCode}</span>
                      <svg className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 z-10 mt-2 w-80 max-h-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                      <div className="sticky top-0 bg-white p-3 border-b border-slate-100">
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountryCode(country.code);
                              setShowCountryDropdown(false);
                              setCountrySearch('');
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="flex-1 text-left font-medium text-slate-700">{country.name}</span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{country.code}</span>
                          </button>
                        ))}
                        {filteredCountries.length === 0 && (
                          <div className="px-4 py-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-sm text-slate-500">No countries found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
                />
              </div>
            </div>
          )}

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              style={{ backgroundColor: 'var(--accent, #0891b2)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : 'Send Code'}
            </button>
          </>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <>
            {/* Illustration */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-20 blur-xl" />
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center shadow-lg ring-4 ring-white">
                  <span className="text-4xl">🔒</span>
                </div>
              </div>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-slate-900">Enter OTP Code</h2>
            <p className="mb-6 text-sm text-slate-600">
              {deliveryMethod === 'email' 
                ? `Enter the 6-digit code sent to ${email}`
                : `Enter the 6-digit code sent to ${selectedCountryCode} ${phoneNumber}`
              }
            </p>

            {devMode && devOtpCode && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-800">Development Mode</p>
                  <p className="mt-1 text-amber-700">Your OTP code: <span className="font-mono font-bold text-lg">{devOtpCode}</span></p>
                </div>
              </div>
            )}

            {/* 6 OTP Input Boxes */}
            <div className="mb-6 flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="h-16 w-12 rounded-xl border-2 border-slate-200 bg-white text-center text-2xl font-bold text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:shadow-md sm:h-18 sm:w-14"
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Resend */}
            <div className="mb-6 text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-slate-500">
                  Resend code in <span className="font-semibold text-blue-600">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              style={{ backgroundColor: 'var(--accent, #0891b2)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify Code'}
            </button>

            {/* Back to phone */}
            <button
              onClick={() => setStep('phone')}
              className="mt-4 w-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Change phone number
            </button>
          </>
        )}
      </div>
    </div>
  );
}
