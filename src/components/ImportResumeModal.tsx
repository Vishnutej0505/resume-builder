import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { importResumeText } from '../lib/ai.ts';
import { colors, fontSize, radius, spacing, SECTION_LABELS } from '../theme/tokens.ts';
import type { PersonalInfo, ResumeSection } from '../types/resume.ts';

interface Props {
  visible: boolean;
  onClose: () => void;
  onImport: (personalInfo: PersonalInfo, sections: ResumeSection[]) => void;
  hasExistingContent: boolean;
  canUseAI: boolean;
  onBlocked: () => void;
  onCreditSpent: () => void;
}

const MIN_LENGTH = 50;

type Step =
  | { kind: 'input' }
  | { kind: 'loading' }
  | { kind: 'confirm'; personalInfo: PersonalInfo; sections: ResumeSection[] }
  | { kind: 'error'; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  parse_failed: "Couldn't make sense of that text. Try pasting just the resume content, without extra formatting.",
  daily_cap_reached: "This app's AI budget for today is used up — try again tomorrow, or fill in your resume manually.",
  network: 'Could not reach the AI service. Check your connection and try again.',
  text_too_long: 'That resume text is too long — try trimming it down.',
};

export function ImportResumeModal({
  visible,
  onClose,
  onImport,
  hasExistingContent,
  canUseAI,
  onBlocked,
  onCreditSpent,
}: Props) {
  const [text, setText] = useState('');
  const [step, setStep] = useState<Step>({ kind: 'input' });

  function handleClose() {
    setStep({ kind: 'input' });
    setText('');
    onClose();
  }

  async function handleImportPress() {
    if (!canUseAI) {
      onBlocked();
      return;
    }
    if (text.trim().length < MIN_LENGTH) {
      setStep({ kind: 'error', message: 'Paste more of the resume — that looks too short to parse.' });
      return;
    }

    setStep({ kind: 'loading' });
    const result = await importResumeText(text);
    if (!result.ok) {
      setStep({ kind: 'error', message: ERROR_MESSAGES[result.reason ?? 'network'] ?? ERROR_MESSAGES.network });
      return;
    }
    onCreditSpent();
    setStep({ kind: 'confirm', personalInfo: result.personalInfo, sections: result.sections });
  }

  function handleConfirm() {
    if (step.kind !== 'confirm') return;
    onImport(step.personalInfo, step.sections);
    handleClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {step.kind === 'input' && (
            <>
              <Text style={styles.title}>Import from another resume</Text>
              <Text style={styles.subtitle}>
                Paste the text of an existing resume — AI will pull out your details into sections you can edit.
              </Text>
              <TextInput
                style={styles.textarea}
                value={text}
                onChangeText={setText}
                multiline
                placeholder="Paste resume text here…"
                placeholderTextColor={colors.textSecondary}
              />
              <View style={styles.buttonRow}>
                <Pressable style={styles.secondaryButton} onPress={handleClose}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={handleImportPress}>
                  <Text style={styles.primaryButtonText}>Import</Text>
                </Pressable>
              </View>
            </>
          )}

          {step.kind === 'loading' && (
            <View style={styles.centerBlock}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={styles.subtitle}>Reading your resume…</Text>
            </View>
          )}

          {step.kind === 'error' && (
            <>
              <Text style={styles.title}>Import didn&apos;t work</Text>
              <Text style={styles.subtitle}>{step.message}</Text>
              <View style={styles.buttonRow}>
                <Pressable style={styles.secondaryButton} onPress={handleClose}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => setStep({ kind: 'input' })}>
                  <Text style={styles.primaryButtonText}>Try again</Text>
                </Pressable>
              </View>
            </>
          )}

          {step.kind === 'confirm' && (
            <>
              <Text style={styles.title}>Found {step.sections.length} section{step.sections.length === 1 ? '' : 's'}</Text>
              <ScrollView style={styles.confirmList}>
                {step.personalInfo.name ? (
                  <Text style={styles.confirmRow}>• Name: {step.personalInfo.name}</Text>
                ) : null}
                {step.sections.map((s) => (
                  <Text key={s.type} style={styles.confirmRow}>
                    • {SECTION_LABELS[s.type] ?? s.type}: {s.items.length} entr{s.items.length === 1 ? 'y' : 'ies'}
                  </Text>
                ))}
              </ScrollView>
              {hasExistingContent && (
                <Text style={styles.warning}>This replaces your current resume content — it can&apos;t be undone.</Text>
              )}
              <View style={styles.buttonRow}>
                <Pressable style={styles.secondaryButton} onPress={handleClose}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={handleConfirm}>
                  <Text style={styles.primaryButtonText}>{hasExistingContent ? 'Replace resume' : 'Use this'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.md + 8,
    borderTopRightRadius: radius.md + 8,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  title: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary },
  textarea: {
    minHeight: 160,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: fontSize.body, fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: fontSize.body, fontWeight: '600' },
  centerBlock: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  confirmList: { maxHeight: 200 },
  confirmRow: { fontSize: fontSize.body, color: colors.textPrimary, paddingVertical: spacing.xs },
  warning: { fontSize: fontSize.caption, color: colors.warning, fontWeight: '600' },
});
