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
  Image,
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
import Colors from '@/constants/colors';

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        !isLast && styles.settingsRowBorder,
        pressed && onPress ? { opacity: 0.7 } : {},
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      <View style={styles.settingsRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
      </View>
    </Pressable>
  );
}

function CogenitoriSection() {
  const { user, refreshUser } = useAuth();
  const { cogenitori, refreshCogenitori } = useApp();
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [pairing, setPairing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePair = async () => {
    const code = inviteCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
      setErrorMsg('Il codice deve essere di 6 caratteri');
      return;
    }
    setErrorMsg('');
    setPairing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await apiRequest('POST', '/api/cogenitore/pair', { inviteCode: code });
      const data = await res.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Collegato!', data.message || 'Cogenitore collegato con successo!');
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
      'Rimuovi collegamento',
      `Rimuovere il collegamento con ${cog.name || cog.email}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
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
      Alert.alert('Copiato!', 'Codice invito copiato negli appunti');
    }
  };

  return (
    <View style={styles.cogenitoreCard}>
      <View style={styles.cogenitoreHeader}>
        <Ionicons name="people" size={20} color={Colors.skyBlueDark} />
        <Text style={styles.cogenitoreTitle}>Cogenitori</Text>
      </View>

      <Pressable onPress={copyInviteCode} style={styles.inviteCodeBox}>
        <View>
          <Text style={styles.inviteCodeLabel}>Il tuo codice invito</Text>
          <Text style={styles.inviteCodeValue}>{user?.personalInviteCode || '------'}</Text>
        </View>
        <Ionicons name="copy-outline" size={20} color={Colors.mintGreenDark} />
      </Pressable>

      {cogenitori.length > 0 && (
        <View style={styles.pairedSection}>
          {cogenitori.map((cog, index) => (
            <Animated.View key={cog.id} entering={FadeInDown.delay(index * 80).duration(300)}>
              <View style={styles.pairedCard}>
                <LinearGradient
                  colors={['#C7CEEA', '#E3E7F5'] as const}
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
                      {cog.gender === 'maschio' ? 'Papa' :
                       cog.gender === 'femmina' ? 'Mamma' : 'Cogenitore'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleUnpair(cog)}
                    hitSlop={10}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.danger} />
                  </Pressable>
                </LinearGradient>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      <View style={styles.addCogenitoreSection}>
        <Text style={styles.addCogLabel}>
          {cogenitori.length === 0
            ? 'Collega il primo cogenitore'
            : 'Aggiungi altro cogenitore'}
        </Text>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.errorBoxText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.pairInputRow}>
          <TextInput
            style={styles.pairInput}
            value={inviteCodeInput}
            onChangeText={(t) => setInviteCodeInput(t.toUpperCase().slice(0, 6))}
            placeholder="Codice 6 caratteri"
            placeholderTextColor={Colors.textMuted}
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

  useEffect(() => {
    refreshPending();
  }, []);

  if (pendingChanges.length === 0) return null;

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <Ionicons name="notifications" size={20} color="#F4C430" />
        <Text style={styles.pendingTitle}>Approvazioni in attesa</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingChanges.length}</Text>
        </View>
      </View>

      {pendingChanges.map((change, index) => {
        let details: any = {};
        try { details = JSON.parse(change.details || '{}'); } catch {}
        const actionText = change.action === 'add_child'
          ? `Vuole aggiungere ${details.childName || 'un figlio'}`
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
  const { user, logout, updatePremium, refreshUser } = useAuth();
  const { children } = useApp();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Vuoi uscire dal tuo account?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Logout',
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Impostazioni</Text>

        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#A8E6CF', '#C7CEEA'] as const}
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
          </LinearGradient>
        </View>

        {!user?.isPremium && (
          <Pressable
            onPress={() => setShowPremiumModal(true)}
            style={({ pressed }) => [styles.premiumBanner, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={['#F4C430', '#FFBA8C'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGradient}
            >
              <MaterialCommunityIcons name="crown" size={24} color="#FFFFFF" />
              <View style={styles.premiumTextWrap}>
                <Text style={styles.premiumTitle}>Passa a Premium</Text>
                <Text style={styles.premiumSubtitle}>Figli illimitati + funzioni extra</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </Pressable>
        )}

        <PendingApprovalsSection />
        <CogenitoriSection />

        <Text style={styles.sectionTitle}>Generale</Text>
        <View style={styles.settingsCardWrap}>
          <SettingsRow
            icon="person"
            iconColor={Colors.mintGreenDark}
            iconBg={Colors.mintGreenLight}
            label="Account"
            value={user?.name || user?.email || ''}
          />
          <SettingsRow
            icon="language"
            iconColor={Colors.skyBlueDark}
            iconBg={Colors.skyBlueLight}
            label="Lingua"
            value="Italiano"
            onPress={() => Alert.alert('Lingua', 'Attualmente disponibile solo in italiano.')}
          />
          <SettingsRow
            icon="star"
            iconColor="#F4C430"
            iconBg={Colors.creamBeige}
            label="Piano"
            value={user?.isPremium ? 'Premium' : 'Gratuito'}
            onPress={() => setShowPremiumModal(true)}
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>Info</Text>
        <View style={styles.settingsCardWrap}>
          <SettingsRow
            icon="shield-checkmark"
            iconColor={Colors.mintGreenDark}
            iconBg={Colors.mintGreenLight}
            label="Privacy"
            onPress={() => Alert.alert('Privacy', 'I tuoi dati sono sincronizzati in modo sicuro.')}
          />
          <SettingsRow
            icon="information-circle"
            iconColor={Colors.skyBlueDark}
            iconBg={Colors.skyBlueLight}
            label="Versione"
            value="1.0.0"
            isLast
          />
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="log-out" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.footerText}>TarbiyApp v1.0.0</Text>
        <Text style={styles.footerSubtext}>Educazione islamica per i tuoi figli</Text>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <Modal visible={showPremiumModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowPremiumModal(false)} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.premiumModalContent, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.modalHandle} />
            <MaterialCommunityIcons name="crown" size={48} color={Colors.goldAccent} style={{ alignSelf: 'center' }} />
            <Text style={styles.premiumModalTitle}>TarbiyApp Premium</Text>
            <Text style={styles.premiumModalSub}>Sblocca tutte le funzionalita</Text>

            <View style={styles.premiumFeatures}>
              {['Figli illimitati', 'Dashboard dettagliata', 'Sincronizzazione tra genitori', 'Funzioni extra future'].map(f => (
                <View key={f} style={styles.premiumFeatureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.mintGreen} />
                  <Text style={styles.premiumFeatureText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pricingCards}>
              <Pressable
                onPress={async () => {
                  await updatePremium(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPremiumModal(false);
                  Alert.alert('Premium attivato!', 'Grazie per aver scelto Premium (demo).');
                }}
                style={({ pressed }) => [styles.pricingCard, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.pricingPeriod}>Mensile</Text>
                <Text style={styles.pricingPrice}>2</Text>
                <Text style={styles.pricingDetail}>/mese</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  await updatePremium(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPremiumModal(false);
                  Alert.alert('Premium attivato!', 'Risparmi 4 con il piano annuale (demo).');
                }}
                style={({ pressed }) => [styles.pricingCard, styles.pricingCardBest, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>-17%</Text>
                </View>
                <Text style={styles.pricingPeriod}>Annuale</Text>
                <Text style={styles.pricingPrice}>20</Text>
                <Text style={styles.pricingDetail}>/anno</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setShowPremiumModal(false)} style={styles.premiumCloseBtn}>
              <Text style={styles.premiumCloseText}>Magari dopo</Text>
            </Pressable>
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
  pairedAvatarText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary },
  pairedInfo: { flex: 1 },
  pairedName: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textPrimary },
  pairedGender: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary },
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
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pendingTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.textPrimary, flex: 1 },
  pendingBadge: {
    backgroundColor: '#F4C430',
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
  premiumModalTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: Colors.textPrimary, marginTop: 12 },
  premiumModalSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
  premiumFeatures: { width: '100%', gap: 12, marginBottom: 24 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premiumFeatureText: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textPrimary },
  pricingCards: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
  pricingCard: { flex: 1, backgroundColor: Colors.creamBeige, borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  pricingCardBest: { borderColor: Colors.goldAccent, backgroundColor: '#FFF9E6' },
  bestValueBadge: { backgroundColor: Colors.goldAccent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, position: 'absolute', top: -10 },
  bestValueText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.white },
  pricingPeriod: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  pricingPrice: { fontFamily: 'Nunito_800ExtraBold', fontSize: 32, color: Colors.textPrimary },
  pricingDetail: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted },
  premiumCloseBtn: { paddingVertical: 12 },
  premiumCloseText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.textMuted },
});
