import { useSettingsStore } from '../../store/settingsStore';

export default function ApplicationHeader() {
  const { settings } = useSettingsStore();
  const { branding } = settings;

  return (
    <header className="application-school-header" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '5px double #333', paddingBottom: 12, marginBottom: 8,
      fontFamily: '"Times New Roman", serif',
    }}>
      {/* Left logo */}
      <div style={{ flexShrink: 0, width: 80, height: 80 }}>
        {branding.logoUrl
          ? <img className="application-school-logo" src={branding.logoUrl} alt="School logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          : <div style={{ width: 80, height: 80, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', textAlign: 'center' }}>Logo</div>
        }
      </div>

      {/* Centre text */}
      <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {branding.schoolName}
        </h1>
        {branding.schoolSubtitle && <p style={{ margin: '2px 0', fontSize: 13 }}>{branding.schoolSubtitle}</p>}
        {branding.schoolAddress && <p className="application-school-address" style={{ margin: '2px 0', fontSize: 13 }}>{branding.schoolAddress}</p>}
        {branding.schoolPhone && <p style={{ margin: '2px 0', fontSize: 13 }}>Cell#: {branding.schoolPhone}</p>}
        {branding.schoolEmail && <p style={{ margin: '2px 0', fontSize: 12, color: '#555' }}>{branding.schoolEmail}</p>}
      </div>

      {/* Right logo */}
      <div style={{ flexShrink: 0, width: 80, height: 80 }}>
        {branding.logoUrl
          ? <img className="application-school-logo" src={branding.logoUrl} alt="School logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          : <div style={{ width: 80, height: 80, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', textAlign: 'center' }}>Logo</div>
        }
      </div>

      {/* Form title — below the header flex row */}
      <style>{`
        .app-form-title {
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 10px 0 0;
          font-family: "Times New Roman", serif;
        }
        @media print {
          .application-school-header {
            display: flex !important;
            visibility: visible !important;
            break-inside: avoid;
          }
          .application-school-logo,
          .application-school-address {
            display: block !important;
            visibility: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </header>
  );
}

export function FormTitle({ title }: { title: string }) {
  return (
    <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '10px 0 0', fontFamily: '"Times New Roman", serif', borderBottom: '1px solid #bbb', paddingBottom: 6 }}>
      {title}
    </h2>
  );
}
