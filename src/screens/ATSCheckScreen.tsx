import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useResume } from '../context/ResumeContext.tsx';
import { matchJobDescription, runChecklist, type JDMatchResult } from '../lib/ats.ts';
import { colors, fontSize, radius, spacing } from '../theme/tokens.ts';

interface Props {
  onNavigateHome: () => void;
  onNavigatePreview: () => void;
}

export function ATSCheckScreen({ onNavigateHome, onNavigatePreview }: Props) {
  const { resume, aiUsage } = useResume();
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<JDMatchResult | null | 'too-short'>(null);

  const checklist = useMemo(() => runChecklist(resume), [resume]);
  const canCheckMatch = aiUsage.subscriptionActive || aiUsage.freeCreditsRemaining > 0;

  function handleCheckMatch() {
    if (!canCheckMatch) {
      // Paywall screen isn't built yet — gating logic itself is correct per
      // APP_FLOW.md Section 5 (shares the AI-rewrite gate, no separate counter).
      Alert.alert(
        'Re-tailoring for a new job needs a subscription',
        "You've used your free AI credits. Subscribing is coming soon."
      );
      return;
    }
    const match = matchJobDescription(resume, jobDescription);
    setResult(match === null ? 'too-short' : match);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ATS Check</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.checklistCard}>
          <Text style={styles.sectionLabel}>RESUME HEALTH</Text>
          {checklist.map((item) => (
            <View key={item.id} style={styles.checklistRow}>
              <Text style={{ color: item.passed ? colors.success : colors.error, fontWeight: '700' }}>
                {item.passed ? '✓' : '✕'}
              </Text>
              <Text style={styles.checklistText}>{item.message}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.fieldLabel}>Paste a job description</Text>
          <TextInput
            style={styles.textarea}
            value={jobDescription}
            onChangeText={setJobDescription}
            multiline
            placeholder="Paste the target job description here…"
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable style={styles.checkButton} onPress={handleCheckMatch}>
            <Text style={styles.checkButtonText}>Check Match</Text>
          </Pressable>
        </View>

        {result === 'too-short' && (
          <Text style={styles.hint}>
            That job description looks too short to score — try pasting the full listing.
          </Text>
        )}

        {result && result !== 'too-short' && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultPercent}>{result.matchPercent}%</Text>
              <Text style={styles.resultLabel}>keyword match</Text>
            </View>

            <Text style={styles.chipGroupLabel}>Matched</Text>
            <View style={styles.chipRow}>
              {result.matched.length === 0 && <Text style={styles.hint}>None yet</Text>}
              {result.matched.map((word) => (
                <View key={word} style={[styles.chip, styles.chipMatched]}>
                  <Text style={styles.chipMatchedText}>{word}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.chipGroupLabel}>Missing</Text>
            <View style={styles.chipRow}>
              {result.missing.length === 0 && <Text style={styles.hint}>Nothing missing 🎉</Text>}
              {result.missing.map((word) => (
                <View key={word} style={[styles.chip, styles.chipMissing]}>
                  <Text style={styles.chipMissingText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footerNav}>
        <Pressable style={styles.navButton} onPress={onNavigateHome}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        <View style={styles.navButton}>
          <View style={styles.navPill}>
            <Text style={styles.navIcon}>✓</Text>
          </View>
          <Text style={[styles.navLabel, { color: colors.accent, fontWeight: '600' }]}>ATS Check</Text>
        </View>
        <Pressable style={styles.navButton} onPress={onNavigatePreview}>
          <Text style={styles.navIcon}>◎</Text>
          <Text style={styles.navLabel}>Preview</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 56,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.bodyLg, fontWeight: '700', color: colors.textPrimary },
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  checklistCard: { backgroundColor: colors.surface, borderRadius: radius.md + 4, padding: spacing.lg, gap: spacing.sm },
  sectionLabel: { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checklistText: { fontSize: fontSize.body, color: colors.textPrimary, flex: 1, flexShrink: 1 },
  fieldLabel: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  textarea: {
    minHeight: 100,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  checkButton: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: { color: '#fff', fontSize: fontSize.body, fontWeight: '600' },
  hint: { fontSize: fontSize.caption, color: colors.textSecondary },
  resultCard: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md + 4,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  resultPercent: { fontSize: fontSize.h1, fontWeight: '700', color: colors.success },
  resultLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  chipGroupLabel: { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  chipMatched: { backgroundColor: '#DCFCE7' },
  chipMatchedText: { fontSize: fontSize.caption, color: '#166534' },
  chipMissing: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipMissingText: { fontSize: fontSize.caption, color: colors.textSecondary },
  footerNav: { height: 64, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row' },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navPill: { width: 56, height: 28, borderRadius: radius.pill, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: fontSize.bodyLg, color: colors.textSecondary },
  navLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
});
