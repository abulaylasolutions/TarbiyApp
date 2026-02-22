import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useApp, CogenitoreInfo } from '@/lib/app-context';
import { apiRequest } from '@/lib/query-client';
import { useI18n, getLanguageLabel, Language } from '@/lib/i18n';
import Colors from '@/constants/colors';
import { useTheme } from '@/lib/theme-context';
import PremiumOverlay from '@/components/PremiumOverlay';

interface SettingsRowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingsRow({ icon, iconColor, iconBg, label, value, onPress, isLast }: SettingsRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        pressed && onPress ? { opacity: 0.7 } : {},
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.settingsRight}>
        {value && <Text style={[styles.settingsValue, { color: colors.textMuted }]}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </View>
    </Pressable>
  );
}

function CogenitoriSection({ onOpenPremium }: { onOpenPremium?: () => void }) {
  const { user, refreshUser } = useAuth();
  const { cogenitori, refreshCogenitori } = useApp();
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const isPremium = user?.isPremium;
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [pairing, setPairing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePair = async () => {
    const code = inviteCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
      setErrorMsg(t('codeMustBe6'));
      return;
    }
    setErrorMsg('');
    setPairing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await apiRequest('POST', '/api/cogenitore/pair', { inviteCode: code });
      const data = await res.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('connected'), data.message || t('coParentConnected'));
      setInviteCodeInput('');
      await refreshCogenitori();
      await refreshUser();
    } catch (error: any) {
      const msg = (error?.message || 'Errore').replace(/^\d+:\s*/, '');
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPairing(false);
    }
  };

  const handleUnpair = (cog: CogenitoreInfo) => {
    Alert.alert(
      t('removeConnection'),
      `${t('removeConnectionWith')} ${cog.name || cog.email}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest('POST', '/api/cogenitore/unpair', { targetUserId: cog.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refreshCogenitori();
              await refreshUser();
            } catch {}
          },
        },
      ]
    );
  };

  const copyInviteCode = async () => {
    if (user?.personalInviteCode) {
      await Clipboard.setStringAsync(user.personalInviteCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('copied'), t('inviteCodeCopied'));
    }
  };

  return (
    <View style={[styles.cogenitoreCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.cogenitoreHeader}>
        <Ionicons name="people" size={20} color={isDark ? '#64B5F6' : Colors.skyBlueDark} />
        <Text style={[styles.cogenitoreTitle, { color: colors.textPrimary }]}>{t('coParents')}</Text>
      </View>

      <Pressable onPress={copyInviteCode} style={[styles.inviteCodeBox, { backgroundColor: colors.mintGreenLight }]}>
        <View>
          <Text style={[styles.inviteCodeLabel, { color: colors.textSecondary }]}>{t('yourInviteCode')}</Text>
          <Text style={[styles.inviteCodeValue, { color: '#A8E6CF' }]}>{user?.personalInviteCode || '------'}</Text>
        </View>
        <Ionicons name="copy-outline" size={20} color={colors.mintGreenDark} />
      </Pressable>

      {cogenitori.length > 0 && (
        <View style={styles.pairedSection}>
          {cogenitori.map((cog, index) => (
            <Animated.View key={cog.id} entering={FadeInDown.delay(index * 80).duration(300)}>
              <View style={styles.pairedCard}>
                <LinearGradient
                  colors={[(cog.gender === 'maschio' || cog.gender === 'male') ? '#779ECB' : '#FF6961', (cog.gender === 'maschio' || cog.gender === 'male') ? '#9BB8D8' : '#FF8A84'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pairedGradient}
                >
                  <View style={styles.pairedAvatar}>
                    <Text style={styles.pairedAvatarText}>
                      {(cog.name || cog.email).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.pairedInfo}>
                    <Text style={styles.pairedName}>{cog.name || cog.email}</Text>
                    <Text style={styles.pairedGender}>
                      {(cog.gender === 'maschio' || cog.gender === 'male') ? t('dad') :
                       (cog.gender === 'femmina' || cog.gender === 'female') ? t('mom') : t('coParentLabel')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleUnpair(cog)}
                    hitSlop={10}
                  >
                    <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                  </Pressable>
                </LinearGradient>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      <View style={styles.addCogenitoreSection}>
        <Text style={[styles.addCogLabel, { color: colors.textSecondary }]}>
          {cogenitori.length === 0
            ? t('connectFirstCoParent')
            : t('addAnotherCoParent')}
        </Text>

        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="alert-circle" size={14} color={colors.danger} />
            <Text style={[styles.errorBoxText, { color: colors.danger }]}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.pairInputRow}>
          <TextInput
            style={[styles.pairInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
            value={inviteCodeInput}
            onChangeText={(t) => setInviteCodeInput(t.toUpperCase().slice(0, 6))}
            placeholder={t('code6chars')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Pressable
            onPress={handlePair}
            disabled={pairing || inviteCodeInput.length !== 6}
            style={[styles.pairBtn, (pairing || inviteCodeInput.length !== 6) && { opacity: 0.5 }]}
          >
            {pairing ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="link" size={18} color={Colors.white} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PendingApprovalsSection() {
  const { pendingChanges, approvePending, rejectPending, refreshPending } = useApp();
  const { t } = useI18n();

  useEffect(() => {
    refreshPending();
  }, []);

  if (pendingChanges.length === 0) return null;

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <Ionicons name="notifications" size={20} color={Colors.mintGreenDark} />
        <Text style={styles.pendingTitle}>{t('pendingApprovals')}</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingChanges.length}</Text>
        </View>
      </View>

      {pendingChanges.map((change, index) => {
        let details: any = {};
        try { details = JSON.parse(change.details || '{}'); } catch {}
        const actionText = change.action === 'add_child'
          ? `${t('wantsToAdd')} ${details.childName || t('aChild')}`
          : change.action;

        return (
          <Animated.View key={change.id} entering={FadeInDown.delay(index * 60).duration(300)}>
            <View style={styles.pendingItem}>
              <View style={styles.pendingItemInfo}>
                <Ionicons name="person-add" size={18} color={Colors.skyBlue} />
                <Text style={styles.pendingItemText}>{actionText}</Text>
              </View>
              <View style={styles.pendingActions}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    rejectPending(change.id);
                  }}
                  style={styles.rejectBtn}
                >
                  <Ionicons name="close" size={18} color={Colors.danger} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    approvePending(change.id);
                  }}
                  style={styles.approveBtn}
                >
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updatePremium, refreshUser, updateProfile } = useAuth();
  const { children } = useApp();
  const { lang, setLang, t, isRTL } = useI18n();
  const { isDark, toggleDark, colors } = useTheme();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBirthDay, setEditBirthDay] = useState('');
  const [editBirthMonth, setEditBirthMonth] = useState('');
  const [editBirthYear, setEditBirthYear] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const openEditModal = () => {
    setEditName(user?.name || '');
    if (user?.birthDate) {
      const d = new Date(user.birthDate);
      setEditBirthDay(String(d.getDate()));
      setEditBirthMonth(String(d.getMonth() + 1));
      setEditBirthYear(String(d.getFullYear()));
    } else {
      setEditBirthDay('');
      setEditBirthMonth('');
      setEditBirthYear('');
    }
    setEditGender(user?.gender || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError(t('enterYourName'));
      return;
    }
    const day = parseInt(editBirthDay, 10);
    const month = parseInt(editBirthMonth, 10);
    const year = parseInt(editBirthYear, 10);
    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 1940 || year > 2010) {
      setEditError(t('invalidBirthDate'));
      return;
    }
    if (!editGender) {
      setEditError(t('selectYourGender'));
      return;
    }
    setEditSaving(true);
    setEditError('');
    const birthDate = new Date(year, month - 1, day).toISOString();
    const result = await updateProfile({
      name: editName.trim(),
      birthDate,
      gender: editGender,
    });
    setEditSaving(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
    } else {
      setEditError(result.message || 'Errore');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleSelectLanguage = async (selectedLang: Language) => {
    setLang(selectedLang);
    try {
      await apiRequest('PUT', '/api/auth/language', { language: selectedLang });
    } catch {}
    setShowLangModal(false);
  };

  const langOptions: { code: Language; label: string; circleText: string; circleColor: string }[] = [
    { code: 'it', label: 'Italiano', circleText: 'IT', circleColor: '#4A90E2' },
    { code: 'en', label: 'English', circleText: 'EN', circleColor: '#7BC8A4' },
    { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', circleText: 'AR', circleColor: '#6BBF9A' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, direction: isRTL ? 'rtl' : 'ltr' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('settings')}</Text>

        <Pressable onPress={openEditModal} style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.9 }]}>
          <LinearGradient
            colors={[(user?.gender === 'femmina' || user?.gender === 'female') ? '#FF6961' : '#779ECB', (user?.gender === 'femmina' || user?.gender === 'female') ? '#FF8A84' : '#9BB8D8'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(user?.name || user?.email || 'G').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Genitore'}</Text>
              <Text style={styles.profileSub}>{user?.email}</Text>
            </View>
            <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </Pressable>

        {!user?.isPremium && (
          <Pressable
            onPress={() => setShowPremiumModal(true)}
            style={({ pressed }) => [styles.premiumBanner, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={[colors.premiumGradient1, colors.premiumGradient2] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGradient}
            >
              <MaterialCommunityIcons name="crown" size={24} color="#FFFFFF" />
              <View style={styles.premiumTextWrap}>
                <Text style={styles.premiumTitle}>{t('upgradeTitle')}</Text>
                <Text style={styles.premiumSubtitle}>{t('upgradeSub')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </Pressable>
        )}

        <PendingApprovalsSection />
        <CogenitoriSection onOpenPremium={() => setShowPremiumModal(true)} />

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('general')}</Text>
        <View style={[styles.settingsCardWrap, { backgroundColor: colors.cardBackground }]}>
          <SettingsRow
            icon="person"
            iconColor={colors.mintGreenDark}
            iconBg={colors.mintGreenLight}
            label={t('account')}
            value={user?.name || user?.email || ''}
            onPress={openEditModal}
          />
          <SettingsRow
            icon="language"
            iconColor={Colors.skyBlueDark}
            iconBg={isDark ? '#1A3A5C' : Colors.skyBlueLight}
            label={t('language')}
            value={getLanguageLabel(lang)}
            onPress={() => setShowLangModal(true)}
          />
          <View style={[styles.settingsRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.mintGreenLight }]}>
              <Ionicons name="calendar" size={18} color={colors.mintGreenDark} />
            </View>
            <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>{t('hijriCalendar')}</Text>
            <View style={styles.settingsRight}>
              <Text style={[styles.settingsValue, { marginRight: 8, color: colors.textMuted }]}>
                {(user as any)?.preferredHijriCalendar ? t('hijriOn') : t('hijriOff')}
              </Text>
              <Pressable
                onPress={async () => {
                  const newVal = !(user as any)?.preferredHijriCalendar;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  try {
                    await apiRequest('PUT', '/api/auth/hijri-calendar', { preferredHijriCalendar: newVal });
                    await refreshUser();
                  } catch {}
                }}
                style={[
                  { width: 48, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 3, backgroundColor: (user as any)?.preferredHijriCalendar ? colors.mintGreen : colors.textMuted + '40' },
                ]}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white,
                  alignSelf: (user as any)?.preferredHijriCalendar ? 'flex-end' : 'flex-start',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
                }} />
              </Pressable>
            </View>
          </View>
          <View style={[styles.settingsRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.settingsIcon, { backgroundColor: isDark ? '#2A2A4A' : '#E8EAF6' }]}>
              <Ionicons name="moon" size={18} color={isDark ? '#BB86FC' : '#5C6BC0'} />
            </View>
            <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>{t('darkMode')}</Text>
            <View style={styles.settingsRight}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleDark();
                }}
                style={[
                  { width: 48, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 3, backgroundColor: isDark ? '#BB86FC' : colors.textMuted + '40' },
                ]}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white,
                  alignSelf: isDark ? 'flex-end' : 'flex-start',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
                }} />
              </Pressable>
            </View>
          </View>
          <SettingsRow
            icon="star"
            iconColor={colors.mintGreenDark}
            iconBg={colors.mintGreenLight}
            label={t('plan')}
            value={user?.isPremium ? t('premium') : t('free')}
            onPress={() => setShowPremiumModal(true)}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('info')}</Text>
        <View style={[styles.settingsCardWrap, { backgroundColor: colors.cardBackground }]}>
          <SettingsRow
            icon="shield-checkmark"
            iconColor={colors.mintGreenDark}
            iconBg={colors.mintGreenLight}
            label={t('privacy')}
            onPress={() => Alert.alert(t('privacy'), t('privacyMsg'))}
          />
          <SettingsRow
            icon="information-circle"
            iconColor={Colors.skyBlueDark}
            iconBg={isDark ? '#1A3A5C' : Colors.skyBlueLight}
            label={t('version')}
            value="1.0.0"
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{lang === 'it' ? 'Contatti' : lang === 'ar' ? 'اتصل بنا' : 'Contact'}</Text>
        <View style={[styles.settingsCardWrap, { backgroundColor: colors.cardBackground }]}>
          <SettingsRow
            icon="logo-instagram"
            iconColor="#E1306C"
            iconBg="#FCE4EC"
            label="Instagram @tarbiyapp"
            onPress={() => Linking.openURL('instagram://user?username=tarbiyapp').catch(() => Linking.openURL('https://www.instagram.com/tarbiyapp'))}
          />
          <SettingsRow
            icon="mail"
            iconColor="#FF6B35"
            iconBg="#FFF3E0"
            label={lang === 'it' ? 'Segnala un problema' : lang === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report a problem'}
            onPress={() => Linking.openURL('mailto:abulaylasolutions@gmail.com?subject=Segnala%20un%20problema&body=Scrivi%20qui%20il%20tuo%20messaggio...')}
            isLast
          />
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="log-out" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>{t('logout')}</Text>
        </Pressable>

        <Text style={[styles.footerText, { color: colors.textMuted }]}>TarbiyApp v1.0.0</Text>
        <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>{t('islamicEducation')}</Text>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <Pressable style={styles.modalDismiss} onPress={() => setShowEditModal(false)} />
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={[styles.editModalContent, { paddingBottom: insets.bottom + 16, backgroundColor: colors.modalBackground }]}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />
                <Text style={[styles.editModalTitle, { color: colors.textPrimary }]}>{t('editProfile')}</Text>

                {editError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={14} color={Colors.danger} />
                    <Text style={styles.errorBoxText}>{editError}</Text>
                  </View>
                ) : null}

                <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>{t('name')}</Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('yourName')}
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>Data di nascita</Text>
                <View style={styles.editDateRow}>
                  <TextInput
                    style={[styles.editInput, styles.editDateInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                    value={editBirthDay}
                    onChangeText={(t) => { if (t.length <= 2) setEditBirthDay(t); }}
                    placeholder="GG"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.editInput, styles.editDateInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                    value={editBirthMonth}
                    onChangeText={(t) => { if (t.length <= 2) setEditBirthMonth(t); }}
                    placeholder="MM"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.editInput, styles.editDateInputYear, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                    value={editBirthYear}
                    onChangeText={(t) => { if (t.length <= 4) setEditBirthYear(t); }}
                    placeholder="AAAA"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>

                <Text style={[styles.editInputLabel, { color: colors.textSecondary }]}>Genere</Text>
                <View style={styles.editGenderRow}>
                  <Pressable
                    onPress={() => setEditGender('male')}
                    style={[styles.editGenderBtn, { backgroundColor: colors.inputBackground }, (editGender === 'male' || editGender === 'maschio') && styles.editGenderBtnActive]}
                  >
                    <Ionicons name="man" size={20} color={(editGender === 'male' || editGender === 'maschio') ? '#4A90E2' : colors.textMuted} />
                    <Text style={[styles.editGenderText, { color: colors.textSecondary }, (editGender === 'male' || editGender === 'maschio') && { color: '#4A90E2' }]}>Uomo</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEditGender('female')}
                    style={[styles.editGenderBtn, { backgroundColor: colors.inputBackground }, (editGender === 'female' || editGender === 'femmina') && styles.editGenderBtnFemActive]}
                  >
                    <Ionicons name="woman" size={20} color={(editGender === 'female' || editGender === 'femmina') ? '#FF6B6B' : colors.textMuted} />
                    <Text style={[styles.editGenderText, { color: colors.textSecondary }, (editGender === 'female' || editGender === 'femmina') && { color: '#FF6B6B' }]}>Donna</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleSaveProfile}
                  disabled={editSaving}
                  style={[styles.editSaveBtn, editSaving && { opacity: 0.6 }]}
                >
                  {editSaving ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={Colors.white} />
                      <Text style={styles.editSaveText}>{t('save')}</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showPremiumModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowPremiumModal(false)} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.premiumModalContent, { paddingBottom: insets.bottom + 16, backgroundColor: colors.modalBackground }]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCrownCircle}
            >
              <MaterialCommunityIcons name="crown" size={36} color={Colors.white} />
            </LinearGradient>
            <Text style={[styles.premiumModalTitle, { color: colors.textPrimary }]}>TarbiyApp Premium</Text>
            <Text style={[styles.premiumModalSub, { color: colors.textSecondary }]}>{t('premiumUnlock')}</Text>

            <Text style={styles.premiumTrialNote}>{t('premiumTrial')}</Text>

            <View style={styles.premiumFeatures}>
              {[
                { icon: 'people', text: t('premiumFeat1') },
                { icon: 'bar-chart', text: t('premiumFeat2') },
                { icon: 'sync', text: t('premiumFeat3') },
                { icon: 'color-palette', text: t('premiumFeat4') },
                { icon: 'sparkles', text: t('premiumFeat5') },
              ].map(f => (
                <View key={f.text} style={styles.premiumFeatureRow}>
                  <View style={styles.premiumFeatureIcon}>
                    <Ionicons name={f.icon as any} size={18} color={Colors.mintGreenDark} />
                  </View>
                  <Text style={[styles.premiumFeatureText, { color: colors.textPrimary }]}>{f.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pricingColumn}>
              <Pressable
                onPress={async () => {
                  await updatePremium(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPremiumModal(false);
                  Alert.alert(t('premiumActivated'), t('premiumMonthlyMsg'));
                }}
                style={({ pressed }) => [styles.pricingCard, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.pricingCardRow}>
                  <View style={styles.pricingCardInfo}>
                    <Text style={styles.pricingPeriod}>{t('monthly')}</Text>
                    <Text style={[styles.pricingPrice, { color: colors.textPrimary }]}>€2.99<Text style={[styles.pricingDetail, { color: colors.textSecondary }]}> /{t('month')}</Text></Text>
                  </View>
                  <View style={styles.pricingBuyBtn}>
                    <Text style={styles.pricingBuyText}>{t('buy')}</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={async () => {
                  await updatePremium(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPremiumModal(false);
                  Alert.alert(t('premiumActivated'), t('premiumAnnualMsg'));
                }}
                style={({ pressed }) => [styles.pricingCard, styles.pricingCardBest, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.pricingCardRow}>
                  <View style={styles.pricingCardInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.pricingPeriod}>{t('annual')}</Text>
                      <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>{t('save17')}</Text>
                      </View>
                    </View>
                    <Text style={styles.pricingPrice}>€24.99<Text style={styles.pricingDetail}> /{t('year')}</Text></Text>
                  </View>
                  <View style={[styles.pricingBuyBtn, { backgroundColor: Colors.goldAccent }]}>
                    <Text style={styles.pricingBuyText}>{t('buy')}</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={async () => {
                  await updatePremium(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPremiumModal(false);
                  Alert.alert(t('premiumActivated'), t('premiumLifetimeMsg'));
                }}
                style={({ pressed }) => [styles.pricingCard, styles.pricingCardLifetime, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.pricingCardRow}>
                  <View style={styles.pricingCardInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.pricingPeriod}>{t('lifetime')}</Text>
                      <View style={styles.lifetimeBadge}>
                        <Ionicons name="infinite" size={14} color={Colors.white} />
                      </View>
                    </View>
                    <Text style={styles.pricingPrice}>€49.99<Text style={styles.pricingDetail}> {t('oneTime')}</Text></Text>
                  </View>
                  <View style={[styles.pricingBuyBtn, { backgroundColor: '#9C27B0' }]}>
                    <Text style={styles.pricingBuyText}>{t('buy')}</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(t('restoreTitle'), t('restoreMsg'));
              }}
              style={styles.restoreBtn}
            >
              <Ionicons name="refresh" size={16} color={Colors.mintGreenDark} />
              <Text style={styles.restoreText}>{t('restorePurchases')}</Text>
            </Pressable>

            <Pressable onPress={() => setShowPremiumModal(false)} style={styles.premiumCloseBtn}>
              <Text style={styles.premiumCloseText}>{t('maybeLater')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showLangModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowLangModal(false)} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.langModalContent, { paddingBottom: insets.bottom + 16, backgroundColor: colors.modalBackground }]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />
            <Text style={[styles.editModalTitle, { color: colors.textPrimary }]}>{t('selectLanguage')}</Text>
            {langOptions.map((option, index) => (
              <Pressable
                key={option.code}
                onPress={() => handleSelectLanguage(option.code)}
                style={[
                  styles.langOption,
                  { borderBottomColor: colors.border },
                  lang === option.code && { backgroundColor: colors.mintGreenLight, borderRadius: 14 },
                  index === langOptions.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.langCircle, { backgroundColor: option.circleColor }]}>
                  <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.white }}>{option.circleText}</Text>
                </View>
                <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: colors.textPrimary, flex: 1 }}>{option.label}</Text>
                <View style={[styles.langRadio, lang === option.code && styles.langRadioActive]} />
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: Colors.textPrimary, marginBottom: 20 },
  profileCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  profileGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: Colors.textPrimary },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.white },
  profileSub: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  premiumBanner: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  premiumGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  premiumTextWrap: { flex: 1 },
  premiumTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.white },
  premiumSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  cogenitoreCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cogenitoreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cogenitoreTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.textPrimary },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.mintGreenLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  inviteCodeLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary },
  inviteCodeValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: Colors.mintGreenDark, letterSpacing: 3, marginTop: 2 },
  pairedSection: { gap: 8, marginBottom: 14 },
  pairedCard: { borderRadius: 16, overflow: 'hidden' },
  pairedGradient: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  pairedAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  pairedAvatarText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#000000' },
  pairedInfo: { flex: 1 },
  pairedName: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FFFFFF' },
  pairedGender: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  addCogenitoreSection: { gap: 10 },
  addCogLabel: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, borderRadius: 10, padding: 10, gap: 6 },
  errorBoxText: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.danger, flex: 1 },
  pairInputRow: { flexDirection: 'row', gap: 10 },
  pairInput: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
  pairBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCard: {
    backgroundColor: Colors.mintGreenLight,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.mintGreen,
  },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pendingTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.textPrimary, flex: 1 },
  pendingBadge: {
    backgroundColor: Colors.mintGreenDark,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.white },
  pendingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 12, marginBottom: 8,
  },
  pendingItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  pendingItemText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textPrimary, flex: 1 },
  pendingActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center',
  },
  approveBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.mintGreen, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  settingsCardWrap: { backgroundColor: Colors.cardBackground, borderRadius: 20, marginBottom: 20, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.creamBeige },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.textPrimary, flex: 1 },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingsValue: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 8 },
  logoutText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.danger },
  footerText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 20 },
  footerSubtext: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: 20 },
  premiumModalContent: { backgroundColor: Colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center' },
  premiumCrownCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  premiumModalTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: Colors.textPrimary, marginTop: 8 },
  premiumModalSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 8 },
  premiumTrialNote: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.mintGreenDark, backgroundColor: Colors.mintGreenLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  premiumFeatures: { width: '100%', gap: 10, marginBottom: 20 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumFeatureIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: Colors.mintGreenLight, alignItems: 'center', justifyContent: 'center' },
  premiumFeatureText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textPrimary, flex: 1 },
  pricingColumn: { width: '100%', gap: 16, marginBottom: 12, paddingTop: 12 },
  pricingCard: { width: '100%', backgroundColor: Colors.creamBeige, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  pricingCardBest: { borderColor: Colors.mintGreen, backgroundColor: Colors.mintGreenLight },
  pricingCardLifetime: { borderColor: '#B39DDB', backgroundColor: '#F3E5F5' },
  pricingCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pricingCardInfo: { flex: 1, gap: 2 },
  pricingBuyBtn: { backgroundColor: Colors.mintGreen, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  pricingBuyText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.white },
  bestValueBadge: { backgroundColor: Colors.goldAccent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  bestValueText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.white },
  lifetimeBadge: { backgroundColor: '#9C27B0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  pricingPeriod: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  pricingPrice: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: Colors.textPrimary },
  pricingDetail: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  restoreText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.mintGreenDark },
  premiumCloseBtn: { paddingVertical: 8 },
  premiumCloseText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.textMuted },
  editModalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  editModalTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 20 },
  editInputLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  editInput: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.creamBeige, borderRadius: 16, padding: 14, marginBottom: 16 },
  editDateRow: { flexDirection: 'row', gap: 10 },
  editDateInput: { flex: 1, textAlign: 'center' as const },
  editDateInputYear: { flex: 1.5, textAlign: 'center' as const },
  editGenderRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  editGenderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.creamBeige,
  },
  editGenderBtnActive: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#4A90E2' },
  editGenderBtnFemActive: { backgroundColor: '#FFEBEE', borderWidth: 2, borderColor: '#FF6B6B' },
  editGenderText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textSecondary },
  editSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.mintGreen, paddingVertical: 16, borderRadius: 20, marginTop: 8,
  },
  editSaveText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.white },
  langModalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.creamBeige,
  },
  langOptionActive: {
    backgroundColor: Colors.mintGreenLight,
    borderRadius: 14,
  },
  langCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  langRadioActive: {
    borderColor: Colors.mintGreenDark,
    backgroundColor: Colors.mintGreenDark,
  },
});
