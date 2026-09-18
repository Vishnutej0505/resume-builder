import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ResumeProvider } from './src/context/ResumeContext.tsx';
import { ATSCheckScreen } from './src/screens/ATSCheckScreen.tsx';
import { HomeScreen } from './src/screens/HomeScreen.tsx';
import { PaywallScreen } from './src/screens/PaywallScreen.tsx';
import { PreviewScreen } from './src/screens/PreviewScreen.tsx';
import { SettingsScreen } from './src/screens/SettingsScreen.tsx';

// One state value at the app root, no router — per TRD.md Section 2 and
// APP_FLOW.md Section 2.
type Screen = 'home' | 'ats' | 'preview' | 'settings' | 'paywall';
// Where Paywall returns to on dismiss/subscribe, and why it was shown —
// per APP_FLOW.md Section 7.
type PaywallOrigin = 'home' | 'ats';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [paywallOrigin, setPaywallOrigin] = useState<PaywallOrigin>('home');

  function showPaywall(origin: PaywallOrigin) {
    setPaywallOrigin(origin);
    setScreen('paywall');
  }

  return (
    <ResumeProvider>
      {screen === 'home' && (
        <HomeScreen
          onNavigateATS={() => setScreen('ats')}
          onNavigatePreview={() => setScreen('preview')}
          onNavigateSettings={() => setScreen('settings')}
          onAIBlocked={() => showPaywall('home')}
        />
      )}
      {screen === 'ats' && (
        <ATSCheckScreen
          onNavigateHome={() => setScreen('home')}
          onNavigatePreview={() => setScreen('preview')}
          onBlocked={() => showPaywall('ats')}
        />
      )}
      {screen === 'preview' && (
        <PreviewScreen onNavigateHome={() => setScreen('home')} onNavigateATS={() => setScreen('ats')} />
      )}
      {screen === 'settings' && <SettingsScreen onBack={() => setScreen('home')} />}
      {screen === 'paywall' && (
        <PaywallScreen
          reason={paywallOrigin === 'home' ? 'ai-credits' : 're-tailor'}
          onDismiss={() => setScreen(paywallOrigin)}
        />
      )}
      <StatusBar style="auto" />
    </ResumeProvider>
  );
}
