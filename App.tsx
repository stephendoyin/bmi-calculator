import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

type UnitSystem = 'metric' | 'imperial';
type Screen = 'home' | 'settings' | 'terms' | 'privacy';

interface BMIResult {
  value: number;
  category: string;
  color: string;
  description: string;
}

function getBMIResult(bmi: number): BMIResult {
  if (bmi < 18.5) return { value: bmi, category: 'Underweight', color: '#3B82F6', description: 'You may need to gain some weight.' };
  if (bmi < 25)   return { value: bmi, category: 'Normal Weight', color: '#22C55E', description: 'You have a healthy body weight.' };
  if (bmi < 30)   return { value: bmi, category: 'Overweight', color: '#F59E0B', description: 'You may need to lose some weight.' };
  return           { value: bmi, category: 'Obese', color: '#EF4444', description: 'Please consult a healthcare professional.' };
}

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ title, onBack, rightLabel, onRight }: {
  title: string;
  onBack?: () => void;
  rightLabel?: string;
  onRight?: () => void;
}) {
  return (
    <View style={styles.headerBar}>
      <View style={styles.headerSide}>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.headerBack}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSide}>
        {onRight && (
          <TouchableOpacity onPress={onRight} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.headerBack}>{rightLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ unit, onGoSettings }: { unit: UnitSystem; onGoSettings: () => void }) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<BMIResult | null>(null);
  const [error, setError] = useState('');

  function calculate() {
    setError('');
    setResult(null);
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      setError('Please enter valid height and weight.');
      return;
    }
    let bmi: number;
    if (unit === 'metric') {
      const hm = h / 100;
      bmi = w / (hm * hm);
    } else {
      bmi = (w / (h * h)) * 703;
    }
    if (bmi < 10 || bmi > 100) {
      setError('Please check your values and try again.');
      return;
    }
    setResult(getBMIResult(parseFloat(bmi.toFixed(1))));
  }

  const heightLabel = unit === 'metric' ? 'Height (cm)' : 'Height (inches)';
  const weightLabel = unit === 'metric' ? 'Weight (kg)' : 'Weight (lbs)';

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>BMI Calculator</Text>
          <Text style={styles.subtitle}>Body Mass Index</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{heightLabel}</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            placeholder={unit === 'metric' ? 'e.g. 175' : 'e.g. 69'}
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
          <Text style={[styles.label, { marginTop: 16 }]}>{weightLabel}</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder={unit === 'metric' ? 'e.g. 70' : 'e.g. 154'}
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.85}>
          <Text style={styles.calcBtnText}>Calculate BMI</Text>
        </TouchableOpacity>

        {result && (
          <View style={[styles.resultCard, { borderColor: result.color }]}>
            <Text style={styles.resultLabel}>Your BMI</Text>
            <Text style={[styles.resultValue, { color: result.color }]}>{result.value}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: result.color }]}>
              <Text style={styles.categoryText}>{result.category}</Text>
            </View>
            <Text style={styles.resultDesc}>{result.description}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>BMI Categories</Text>
          {[
            { range: 'Below 18.5', label: 'Underweight', color: '#3B82F6' },
            { range: '18.5 – 24.9', label: 'Normal Weight', color: '#22C55E' },
            { range: '25.0 – 29.9', label: 'Overweight', color: '#F59E0B' },
            { range: '30.0 and above', label: 'Obese', color: '#EF4444' },
          ].map(row => (
            <View key={row.label} style={styles.tableRow}>
              <View style={[styles.dot, { backgroundColor: row.color }]} />
              <Text style={styles.tableRange}>{row.range}</Text>
              <Text style={styles.tableLabel}>{row.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          BMI is a screening tool, not a diagnostic measure. Consult a healthcare professional for medical advice.
        </Text>
      </ScrollView>
    </>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen({ unit, onSetUnit, onBack, onGoTerms, onGoPrivacy }: {
  unit: UnitSystem;
  onSetUnit: (u: UnitSystem) => void;
  onBack: () => void;
  onGoTerms: () => void;
  onGoPrivacy: () => void;
}) {
  return (
    <>
      <Header title="Settings" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Unit System</Text>
          <Text style={styles.settingDesc}>Choose the measurement units used for height and weight.</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, unit === 'metric' && styles.toggleActive]}
              onPress={() => onSetUnit('metric')}>
              <Text style={[styles.toggleText, unit === 'metric' && styles.toggleTextActive]}>Metric (cm / kg)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, unit === 'imperial' && styles.toggleActive]}
              onPress={() => onSetUnit('imperial')}>
              <Text style={[styles.toggleText, unit === 'imperial' && styles.toggleTextActive]}>Imperial (in / lbs)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingKey}>App Name</Text>
            <Text style={styles.settingVal}>BMI Calculator</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingKey}>Version</Text>
            <Text style={styles.settingVal}>1.0.0</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingKey}>Developer</Text>
            <Text style={styles.settingVal}>stephen</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.linkRow} onPress={onGoTerms}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkRow} onPress={onGoPrivacy}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </>
  );
}

// ─── Terms of Service ─────────────────────────────────────────────────────────
function TermsScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Header title="Terms of Service" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.legalDate}>Last updated: June 30, 2025</Text>
          <Text style={styles.legalHeading}>1. Acceptance of Terms</Text>
          <Text style={styles.legalText}>
            By downloading or using the BMI Calculator app ("App"), you agree to these Terms of Service. If you do not agree, please do not use the App.
          </Text>
          <Text style={styles.legalHeading}>2. Medical Disclaimer</Text>
          <Text style={styles.legalText}>
            The BMI Calculator is provided for informational and educational purposes only. It is not a medical device and does not provide medical advice, diagnosis, or treatment.{'\n\n'}
            BMI is a general screening tool and does not account for individual factors such as muscle mass, bone density, age, sex, or ethnicity. Results should not be used as a substitute for professional medical advice.{'\n\n'}
            Always consult a qualified healthcare professional before making any decisions based on your BMI.
          </Text>
          <Text style={styles.legalHeading}>3. Accuracy of Information</Text>
          <Text style={styles.legalText}>
            All calculations are performed locally on your device using standard BMI formulas. We make no warranty that the results are accurate, complete, or suitable for any particular purpose.
          </Text>
          <Text style={styles.legalHeading}>4. No Data Collection</Text>
          <Text style={styles.legalText}>
            This App does not collect, transmit, or store any personal data. All information you enter is processed locally on your device and is not sent to any server.
          </Text>
          <Text style={styles.legalHeading}>5. Changes to Terms</Text>
          <Text style={styles.legalText}>
            We reserve the right to update these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.
          </Text>
          <Text style={styles.legalHeading}>6. Contact</Text>
          <Text style={styles.legalText}>
            If you have any questions about these Terms, please contact us at the email address listed on the Google Play Store listing.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

// ─── Privacy Policy ───────────────────────────────────────────────────────────
function PrivacyScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Header title="Privacy Policy" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.legalDate}>Last updated: June 30, 2025</Text>
          <Text style={styles.legalHeading}>Overview</Text>
          <Text style={styles.legalText}>
            BMI Calculator ("we", "our", "App") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our App.
          </Text>
          <Text style={styles.legalHeading}>Information We Collect</Text>
          <Text style={styles.legalText}>
            We do not collect any personal information.{'\n\n'}
            The App works entirely offline. Any height or weight values you enter are used solely to calculate your BMI on your device and are never stored, transmitted, or shared.
          </Text>
          <Text style={styles.legalHeading}>No Analytics or Tracking</Text>
          <Text style={styles.legalText}>
            This App does not use any analytics tools, tracking SDKs, advertising networks, or third-party services. We do not track your usage, location, device identifiers, or any other information.
          </Text>
          <Text style={styles.legalHeading}>No Internet Permission</Text>
          <Text style={styles.legalText}>
            The App does not require an internet connection and does not request the INTERNET permission on Android. Your data never leaves your device.
          </Text>
          <Text style={styles.legalHeading}>Children's Privacy</Text>
          <Text style={styles.legalText}>
            This App does not knowingly collect any information from children under the age of 13. Since no data is collected at all, the App is safe for users of all ages.
          </Text>
          <Text style={styles.legalHeading}>Changes to This Policy</Text>
          <Text style={styles.legalText}>
            We may update this Privacy Policy from time to time. Any changes will be reflected in the "last updated" date above.
          </Text>
          <Text style={styles.legalHeading}>Contact Us</Text>
          <Text style={styles.legalText}>
            If you have any questions about this Privacy Policy, please contact us at the email address listed on the Google Play Store listing.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────
function BottomTabs({ active, onChange }: { active: 'home' | 'settings'; onChange: (t: 'home' | 'settings') => void }) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity style={styles.tabItem} onPress={() => onChange('home')} activeOpacity={0.7}>
        <Text style={[styles.tabIcon, active === 'home' && styles.tabIconActive]}>⊙</Text>
        <Text style={[styles.tabLabel, active === 'home' && styles.tabLabelActive]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => onChange('settings')} activeOpacity={0.7}>
        <Text style={[styles.tabIcon, active === 'settings' && styles.tabIconActive]}>⚙</Text>
        <Text style={[styles.tabLabel, active === 'settings' && styles.tabLabelActive]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<'home' | 'settings'>('home');
  const [screen, setScreen] = useState<Screen>('home');
  const [unit, setUnit] = useState<UnitSystem>('metric');

  function handleTabChange(t: 'home' | 'settings') {
    setTab(t);
    setScreen(t);
  }

  const showTabs = screen === 'home' || screen === 'settings';

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <View style={styles.content}>
        {screen === 'home'     && <HomeScreen unit={unit} onGoSettings={() => handleTabChange('settings')} />}
        {screen === 'settings' && <SettingsScreen unit={unit} onSetUnit={setUnit} onBack={() => handleTabChange('home')} onGoTerms={() => setScreen('terms')} onGoPrivacy={() => setScreen('privacy')} />}
        {screen === 'terms'    && <TermsScreen onBack={() => setScreen('settings')} />}
        {screen === 'privacy'  && <PrivacyScreen onBack={() => setScreen('settings')} />}
      </View>
      {showTabs && <BottomTabs active={tab} onChange={handleTabChange} />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerSide: {
    width: 60,
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerBack: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#6366F1',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#334155',
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  calcBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  calcBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  resultLabel: {
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
    marginBottom: 10,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resultDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  tableRange: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 14,
  },
  tableLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  disclaimer: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  settingDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  settingKey: {
    color: '#94A3B8',
    fontSize: 14,
  },
  settingVal: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  linkText: {
    color: '#F1F5F9',
    fontSize: 15,
  },
  linkArrow: {
    color: '#64748B',
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#0F172A',
  },
  legalDate: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 20,
  },
  legalHeading: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  legalText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabIcon: {
    fontSize: 22,
    color: '#475569',
    marginBottom: 2,
  },
  tabIconActive: {
    color: '#6366F1',
  },
  tabLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#6366F1',
  },
});
