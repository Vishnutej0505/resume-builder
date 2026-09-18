import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/tokens.ts';
import type { SectionType } from '../types/resume.ts';

interface Props {
  sectionType: SectionType;
  text: string;
  onChangeText: (text: string) => void;
  onRemove: () => void;
  canUseAI: boolean;
  onBlocked: () => void;
  rewrite: (sectionType: SectionType, text: string) => Promise<{ ok: true; text: string } | { ok: false }>;
  onCreditSpent: () => void;
}

type RewriteState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error' } | { kind: 'suggested'; suggestion: string };

export function BulletRow({
  sectionType,
  text,
  onChangeText,
  onRemove,
  canUseAI,
  onBlocked,
  rewrite,
  onCreditSpent,
}: Props) {
  const [state, setState] = useState<RewriteState>({ kind: 'idle' });

  async function handleAIPress() {
    if (!canUseAI) {
      onBlocked();
      return;
    }
    if (!text.trim()) return;
    setState({ kind: 'loading' });
    const result = await rewrite(sectionType, text);
    if (result.ok) {
      setState({ kind: 'suggested', suggestion: result.text });
    } else {
      setState({ kind: 'error' });
    }
  }

  function handleAccept() {
    if (state.kind !== 'suggested') return;
    onChangeText(state.suggestion);
    onCreditSpent();
    setState({ kind: 'idle' });
  }

  function handleEdit() {
    // Loads the suggestion into the field for further editing — per
    // APP_FLOW.md Section 3, only Accept spends a credit; Edit hands the
    // text back to the user as their own draft, not a finished rewrite.
    if (state.kind !== 'suggested') return;
    onChangeText(state.suggestion);
    setState({ kind: 'idle' });
  }

  function handleKeepOriginal() {
    setState({ kind: 'idle' });
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.textarea}
          value={text}
          onChangeText={onChangeText}
          multiline
          editable={state.kind !== 'loading'}
          placeholder="Describe what you did…"
          placeholderTextColor={colors.textSecondary}
        />
        {state.kind === 'loading' ? (
          <View style={styles.aiButton} accessibilityRole="progressbar" accessibilityLabel="Rewriting with AI, please wait">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <Pressable
            style={styles.aiButton}
            onPress={handleAIPress}
            accessibilityLabel="AI rewrite this bullet"
          >
            <Text style={styles.aiButtonText}>✨</Text>
          </Pressable>
        )}
        <Pressable onPress={onRemove} accessibilityLabel="Remove bullet" hitSlop={8}>
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      </View>

      {state.kind === 'error' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Couldn&apos;t get a suggestion — your original text is unchanged.</Text>
          <Pressable onPress={handleAIPress}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {state.kind === 'suggested' && (
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonLabel}>ORIGINAL</Text>
          <Text style={styles.comparisonText}>{text}</Text>
          <View style={styles.divider} />
          <Text style={[styles.comparisonLabel, { color: colors.accent }]}>SUGGESTED</Text>
          <Text style={[styles.comparisonText, { color: colors.textPrimary }]}>{state.suggestion}</Text>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleAccept}
              accessibilityLabel="Accept AI suggestion"
            >
              <Text style={styles.actionButtonTextLight}>Accept</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.actionButtonOutline]}
              onPress={handleEdit}
              accessibilityLabel="Edit AI suggestion before saving"
            >
              <Text style={styles.actionButtonTextDark}>Edit</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.actionButtonOutline]}
              onPress={handleKeepOriginal}
              accessibilityLabel="Keep original text, discard suggestion"
            >
              <Text style={styles.actionButtonTextMuted}>Keep Original</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  textarea: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: { fontSize: fontSize.bodyLg },
  removeText: { fontSize: fontSize.h2, color: colors.textSecondary, lineHeight: 24, paddingTop: 6 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
  },
  errorText: { flex: 1, fontSize: fontSize.caption, color: '#991B1B' },
  retryText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.error },
  comparisonCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  comparisonLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: colors.textSecondary },
  comparisonText: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 19 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionButton: { flex: 1, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionButtonOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  actionButtonTextLight: { color: '#fff', fontSize: fontSize.caption, fontWeight: '600' },
  actionButtonTextDark: { color: colors.textPrimary, fontSize: fontSize.caption, fontWeight: '600' },
  actionButtonTextMuted: { color: colors.textSecondary, fontSize: fontSize.caption, fontWeight: '600' },
});
