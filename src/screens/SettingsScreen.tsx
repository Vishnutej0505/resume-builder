import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import appConfig from '../../app.json' with { type: 'json' };
import { useResume } from '../context/ResumeContext.tsx';
import { colors, fontSize, spacing } from '../theme/tokens.ts';

interface Props {
  onBack: () => void;
}

const PLAY_STORE_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

export function SettingsScreen({ onBack }: Props) {
  const { aiUsage } = useResume();

  function handleRestorePurchases() {
    // Real restore needs react-native-iap wired to a Play Console product,
    // which needs your Play Console account — see Vault/WIKI/AI Architecture.md.
    Alert.alert('Restore Purchases', 'Subscriptions aren’t set up yet — coming soon.');
  }

  function handleManageSubscription() {
    Linking.openURL(PLAY_STORE_SUBSCRIPTIONS_URL).catch(() => {
      Alert.alert('Could not open link', PLAY_STORE_SUBSCRIPTIONS_URL);
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityLabel="Back" hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.body}>
        <Row
          label="Subscription"
          value={aiUsage.subscriptionActive ? 'Active' : `Free tier — ${aiUsage.freeCreditsRemaining} credits left`}
        />
        <Pressable style={styles.row} onPress={handleRestorePurchases}>
          <Text style={styles.rowLabel}>Restore Purchases</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={handleManageSubscription}>
          <Text style={styles.rowLabel}>Manage Subscription</Text>
        </Pressable>
        <Row label="App version" value={appConfig.expo.version} />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: { fontSize: fontSize.h3, color: colors.textPrimary },
  headerTitle: { fontSize: fontSize.bodyLg, fontWeight: '700', color: colors.textPrimary },
  body: { padding: spacing.lg, gap: spacing.sm },
  row: {
    minHeight: 48,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: fontSize.body, color: colors.textPrimary },
  rowValue: { fontSize: fontSize.body, color: colors.textSecondary },
});
