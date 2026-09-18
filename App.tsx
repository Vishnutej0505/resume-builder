import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { ResumeProvider } from './src/context/ResumeContext.tsx';
import { HomeScreen } from './src/screens/HomeScreen.tsx';
import { colors, fontSize } from './src/theme/tokens.ts';

// One state value at the app root, no router — per TRD.md Section 2 and
// APP_FLOW.md Section 2. ATS Check / Preview / Settings are placeholders
// until those screens are built (Home is the primary-workflow priority).
type Screen = 'home' | 'ats' | 'preview' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <ResumeProvider>
      {screen === 'home' && (
        <HomeScreen
          onNavigateATS={() => setScreen('ats')}
          onNavigatePreview={() => setScreen('preview')}
          onNavigateSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'ats' && <ComingSoon title="ATS Check" onBack={() => setScreen('home')} />}
      {screen === 'preview' && <ComingSoon title="Preview" onBack={() => setScreen('home')} />}
      {screen === 'settings' && <ComingSoon title="Settings" onBack={() => setScreen('home')} />}
      <StatusBar style="auto" />
    </ResumeProvider>
  );
}

function ComingSoon({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.comingSoon}>
      <Text style={styles.comingSoonTitle}>{title}</Text>
      <Text style={styles.comingSoonBody} onPress={onBack}>
        ← Back to Home
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  comingSoon: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bg },
  comingSoonTitle: { fontSize: fontSize.h2, fontWeight: '700', color: colors.textPrimary },
  comingSoonBody: { fontSize: fontSize.body, color: colors.accent },
});
