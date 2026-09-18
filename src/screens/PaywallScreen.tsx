import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/tokens.ts';

interface Props {
  reason: 'ai-credits' | 're-tailor';
  onDismiss: () => void;
}

const REASON_COPY: Record<Props['reason'], string> = {
  'ai-credits': "You've used your 20 free AI credits finishing your first resume.",
  're-tailor': 'Re-tailoring for a new job needs a subscription.',
};

export function PaywallScreen({ reason, onDismiss }: Props) {
  function handleSubscribe() {
    // Real purchase needs react-native-iap wired to a Play Console product
    // (TRD.md Section 8) — that needs your Play Console account and an EAS
    // Dev Build (Expo Go can't load native IAP code). Not buildable from here.
    Alert.alert('Subscriptions coming soon', "This app isn't set up for billing yet — check back soon.");
  }

  function handleRestore() {
    Alert.alert('Restore Purchases', 'No active subscription found.');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onDismiss} accessibilityLabel="Not now, go back" hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⚙</Text>
        </View>

        <Text style={styles.title}>{REASON_COPY[reason]}</Text>
        <Text style={styles.subtitle}>
          Exporting stays free forever — subscribing only unlocks unlimited re-tailoring for new job
          descriptions.
        </Text>

        <View style={styles.priceCard}>
          <Text style={styles.price}>₹29</Text>
          <Text style={styles.priceUnit}> / month, cancel anytime</Text>
        </View>

        <Pressable style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </Pressable>
        <Pressable onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>
        <Pressable onPress={onDismiss}>
          <Text style={styles.notNowText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { height: 56, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  backIcon: { fontSize: fontSize.h3, color: colors.textPrimary },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: fontSize.h2, color: colors.warning },
  title: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  priceCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  price: { fontSize: fontSize.h1, fontWeight: '700', color: colors.textPrimary },
  priceUnit: { fontSize: fontSize.body, color: colors.textSecondary },
  subscribeButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: { color: '#fff', fontSize: fontSize.bodyLg, fontWeight: '600' },
  restoreText: { fontSize: fontSize.body, fontWeight: '600', color: colors.accent },
  notNowText: { fontSize: fontSize.body, color: colors.textSecondary },
});
