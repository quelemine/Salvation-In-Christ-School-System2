import { useSettingsStore } from '../../store/settingsStore';

export default function ApplicationFooter() {
  const { settings } = useSettingsStore();
  return (
    <footer className="application-footer" style={{
      textAlign: 'center', fontSize: 18, fontWeight: 'bold',
      marginTop: 18, paddingTop: 10, borderTop: '1px solid #bbb',
      color: '#6b174f', fontFamily: '"Times New Roman", serif',
    }}>
      MOTTO: &ldquo;{settings.branding.schoolMotto || 'Equipping For A Better Future'}&rdquo;
    </footer>
  );
}
