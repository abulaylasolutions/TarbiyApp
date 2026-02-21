import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import Colors from '@/constants/colors';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Uomo', icon: 'man' as const },
  { value: 'female', label: 'Donna', icon: 'woman' as const },
];

export default function ProfileCompletionScreen() {
  const insets = useSafeAreaInsets();
  const { completeProfile, user } = useAuth();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleComplete = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Il nome è obbligatorio');
      return;
    }

    const day = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);
    const year = parseInt(birthYear, 10);

    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 1940 || year > 2010) {
      setErrorMessage('Inserisci una data di nascita valida');
      return;
    }

    if (!gender) {
      setErrorMessage('Seleziona il tuo sesso');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const birthDate = new Date(year, month - 1, day).toISOString();
    const result = await completeProfile({
      name: name.trim(),
      birthDate,
      gender,
    });

    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Errore nel salvataggio');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[isDark ? colors.backgroundSecondary : Colors.peachPinkLight, colors.background] as const}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: topPadding + 20, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerSection}>
            <View style={[styles.headerIconWrap, { backgroundColor: isDark ? 'rgba(46, 125, 50, 0.2)' : 'rgba(255, 211, 182, 0.3)' }]}>
              <Ionicons name="person-add" size={32} color={colors.mintGreen} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Completa il tuo profilo</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Solo un momento per personalizzare la tua esperienza
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Il tuo nome *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Come ti chiami?"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Data di nascita *</Text>
            <View style={styles.dateRow}>
              <View style={[styles.inputWrapper, styles.dateInput, { backgroundColor: colors.inputBackground }]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', color: colors.textPrimary }]}
                  placeholder="GG"
                  placeholderTextColor={colors.textMuted}
                  value={birthDay}
                  onChangeText={(t) => { if (t.length <= 2) setBirthDay(t); }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={[styles.inputWrapper, styles.dateInput, { backgroundColor: colors.inputBackground }]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', color: colors.textPrimary }]}
                  placeholder="MM"
                  placeholderTextColor={colors.textMuted}
                  value={birthMonth}
                  onChangeText={(t) => { if (t.length <= 2) setBirthMonth(t); }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={[styles.inputWrapper, styles.dateInputYear, { backgroundColor: colors.inputBackground }]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', color: colors.textPrimary }]}
                  placeholder="AAAA"
                  placeholderTextColor={colors.textMuted}
                  value={birthYear}
                  onChangeText={(t) => { if (t.length <= 4) setBirthYear(t); }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Sesso *</Text>
            <View style={styles.genderOptions}>
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setGender(option.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.genderOption,
                    { backgroundColor: colors.inputBackground },
                    gender === option.value && [styles.genderOptionSelected, { backgroundColor: colors.mintGreenLight, borderColor: colors.mintGreen }],
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={gender === option.value ? colors.mintGreenDark : colors.textMuted}
                  />
                  <Text style={[
                    styles.genderText,
                    { color: colors.textSecondary },
                    gender === option.value && [styles.genderTextSelected, { color: colors.mintGreenDark }],
                  ]}>
                    {option.label}
                  </Text>
                  <View style={[
                    styles.radioOuter,
                    { borderColor: colors.textMuted },
                    gender === option.value && { borderColor: colors.mintGreen },
                  ]}>
                    {gender === option.value && <View style={[styles.radioInner, { backgroundColor: colors.mintGreen }]} />}
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleComplete}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.9 },
                loading && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={[colors.mintGreen, colors.mintGreenDark] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={[styles.submitText, { color: colors.white }]}>Completa profilo</Text>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  headerIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 28,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    flex: 1,
  },
  inputLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    paddingVertical: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  dateInputYear: {
    flex: 1.5,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  genderOptions: {
    gap: 10,
    marginBottom: 24,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderOptionSelected: {
    borderWidth: 2,
  },
  genderText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
    flex: 1,
  },
  genderTextSelected: {
    fontFamily: 'Nunito_600SemiBold',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderWidth: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
  },
});
