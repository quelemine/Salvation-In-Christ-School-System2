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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
        >
          ×
        </button>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <>
            {/* Illustration */}
            <div className="mb-6 flex justify-center">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
            </div>

            {/* Delivery Method Tabs */}
            <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setDeliveryMethod('email')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  deliveryMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setDeliveryMethod('sms')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  deliveryMethod === 'sms' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                SMS
              </button>
              <button
                onClick={() => setDeliveryMethod('whatsapp')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  deliveryMethod === 'whatsapp' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                WhatsApp
              </button>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              {deliveryMethod === 'email' ? 'Send to Email' : 'Enter Phone Number'}
            </h2>
            <p className="mb-6 text-sm text-slate-600">
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
                    className="w-32 rounded-lg border border-slate-300 px-3 py-3 text-left text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {countries.find(c => c.code === selectedCountryCode)?.flag} {selectedCountryCode}
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 z-10 mt-1 w-72 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="sticky top-0 bg-white p-2 border-b border-slate-200">
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountryCode(country.code);
                              setShowCountryDropdown(false);
                              setCountrySearch('');
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 transition-colors"
                          >
                            <span>{country.flag}</span>
                            <span className="flex-1 text-left">{country.name}</span>
                            <span className="text-slate-500">{country.code}</span>
                          </button>
                        ))}
                        {filteredCountries.length === 0 && (
                          <div className="px-3 py-4 text-sm text-slate-500 text-center">
                            No countries found
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
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent, #0891b2)' }}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <>
            {/* Illustration */}
            <div className="mb-6 flex justify-center">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-4xl">🔒</span>
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
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <p className="font-semibold text-amber-800">⚠️ Development Mode</p>
                <p className="mt-1 text-amber-700">Your OTP code: <span className="font-mono font-bold text-lg">{devOtpCode}</span></p>
              </div>
            )}

            {/* 6 OTP Input Boxes */}
            <div className="mb-6 flex justify-center gap-2">
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
                  className="h-14 w-12 rounded-lg border-2 border-slate-300 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:h-16 sm:w-14"
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Resend */}
            <div className="mb-6 text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-slate-500">Resend code in {resendTimer}s</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent, #0891b2)' }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            {/* Back to phone */}
            <button
              onClick={() => setStep('phone')}
              className="mt-4 w-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Change phone number
            </button>
          </>
        )}
      </div>
    </div>
  );
}
