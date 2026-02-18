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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import Colors from '@/constants/colors';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email e password sono richiesti');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage('Le password non corrispondono');
      return;
    }

    if (!isLogin && password.length < 6) {
      setErrorMessage('La password deve avere almeno 6 caratteri');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = isLogin
      ? await login(email.trim(), password)
      : await register(email.trim(), password);

    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Si è verificato un errore');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      `${provider} Login`,
      `L'accesso con ${provider} richiede la configurazione delle credenziali OAuth. Disponibile nella versione completa.`,
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.mintGreenLight, Colors.creamBeige, Colors.background] as const}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: topPadding + 40, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Image source={require('@/assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.brandName}>
              <Text style={styles.brandTarbiy}>Tarbiy</Text>
              <Text style={styles.brandApp}>App</Text>
            </Text>
            <Text style={styles.tagline}>Educazione islamica per i tuoi figli</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.formCard}>
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => { setIsLogin(true); setErrorMessage(''); }}
                style={[styles.tab, isLogin && styles.tabActive]}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Accedi</Text>
              </Pressable>
              <Pressable
                onPress={() => { setIsLogin(false); setErrorMessage(''); }}
                style={[styles.tab, !isLogin && styles.tabActive]}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Registrati</Text>
              </Pressable>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textMuted} />
                </Pressable>
              </View>

              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Conferma password"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              )}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.9 },
                loading && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={[Colors.mintGreen, Colors.mintGreenDark] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitText}>
                    {isLogin ? 'Accedi' : 'Registrati'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={() => handleSocialLogin('Google')}
                style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.8 }]}
              >
                <FontAwesome name="google" size={20} color="#DB4437" />
                <Text style={styles.socialBtnText}>Google</Text>
              </Pressable>
              <Pressable
                onPress={() => handleSocialLogin('Facebook')}
                style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.8 }]}
              >
                <FontAwesome name="facebook" size={20} color="#4267B2" />
                <Text style={styles.socialBtnText}>Facebook</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={styles.footerText}>
              I tuoi dati sono al sicuro con noi
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  brandName: {
    fontSize: 36,
    marginBottom: 8,
  },
  brandTarbiy: {
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.mintGreen,
    fontSize: 36,
  },
  brandApp: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textPrimary,
    fontSize: 36,
  },
  tagline: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 28,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.creamBeige,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.mintGreenDark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.danger,
    flex: 1,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.creamBeige,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    color: Colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.creamBeige,
  },
  dividerText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.creamBeige,
    borderRadius: 16,
    paddingVertical: 14,
  },
  socialBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  footerText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
