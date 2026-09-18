import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';
import { colors, radius, spacing, fontSize } from '../theme/tokens.ts';
import type { PersonalInfo } from '../types/resume.ts';

interface Props {
  personalInfo: PersonalInfo;
  onChange: (patch: Partial<PersonalInfo>) => void;
}

export function PersonalInfoCard({ personalInfo, onChange }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Personal Info</Text>

      <Field label="Full name">
        <TextInput
          style={styles.input}
          value={personalInfo.name}
          onChangeText={(name) => onChange({ name })}
          placeholder="Your full name"
          placeholderTextColor={colors.textSecondary}
        />
      </Field>

      <View style={styles.row}>
        <Field label="Email" style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={personalInfo.email}
            onChangeText={(email) => onChange({ email })}
            placeholder="you@email.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>
        <Field label="Phone" style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={personalInfo.phone}
            onChangeText={(phone) => onChange({ phone })}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </Field>
      </View>

      <Field label="Location">
        <TextInput
          style={styles.input}
          value={personalInfo.location}
          onChangeText={(location) => onChange({ location })}
          placeholder="City, State"
          placeholderTextColor={colors.textSecondary}
        />
      </Field>
    </View>
  );
}

function Field({ label, children, style }: { label: string; children: ReactNode; style?: object }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary },
  row: { flexDirection: 'row', gap: spacing.sm },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.caption, color: colors.textSecondary },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
});
