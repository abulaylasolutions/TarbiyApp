import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useApp } from '@/lib/app-context';
import Colors from '@/constants/colors';

interface SettingsRowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
}

function SettingsRow({ icon, iconColor, iconBg, label, value, onPress, isLast, rightElement }: SettingsRowProps) {
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
        {rightElement || (
          <>
            {value && <Text style={styles.settingsValue}>{value}</Text>}
            {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
          </>
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium, setPremium, parentName, setParentName, children } = useApp();
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState(parentName);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await setParentName(nameInput.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowNameModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Impostazioni</Text>

        <Pressable
          onPress={() => {
            setNameInput(parentName);
            setShowNameModal(true);
          }}
          style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={['#A8E6CF', '#C7CEEA'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {parentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{parentName}</Text>
              <Text style={styles.profileSub}>
                {children.length} {children.length === 1 ? 'figlio' : 'figli'} registrati
              </Text>
            </View>
            <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </Pressable>

        {!isPremium && (
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

        <Text style={styles.sectionTitle}>Generale</Text>
        <View style={styles.settingsCard}>
          <SettingsRow
            icon="person"
            iconColor={Colors.mintGreenDark}
            iconBg={Colors.mintGreenLight}
            label="Account"
            value={parentName}
            onPress={() => {
              setNameInput(parentName);
              setShowNameModal(true);
            }}
          />
          <SettingsRow
            icon="language"
            iconColor={Colors.skyBlueDark}
            iconBg={Colors.skyBlueLight}
            label="Lingua"
            value="Italiano"
            onPress={() => {
              Alert.alert('Lingua', 'Attualmente disponibile solo in italiano.');
            }}
          />
          <SettingsRow
            icon="star"
            iconColor="#F4C430"
            iconBg={Colors.creamBeige}
            label="Piano"
            value={isPremium ? 'Premium' : 'Gratuito'}
            onPress={() => setShowPremiumModal(true)}
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>Info</Text>
        <View style={styles.settingsCard}>
          <SettingsRow
            icon="shield-checkmark"
            iconColor={Colors.mintGreenDark}
            iconBg={Colors.mintGreenLight}
            label="Privacy"
            onPress={() => Alert.alert('Privacy', 'I tuoi dati sono salvati localmente sul dispositivo.')}
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
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Logout', 'Funzione disponibile con account online.');
          }}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="log-out" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.footerText}>TarbiyApp v1.0.0</Text>
        <Text style={styles.footerSubtext}>Educazione islamica per i tuoi figli</Text>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <Modal visible={showNameModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowNameModal(false)} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Il tuo nome</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Come ti chiami?"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowNameModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable onPress={handleSaveName} style={styles.modalSaveBtn}>
                <Ionicons name="checkmark" size={22} color={Colors.white} />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
            <Text style={styles.premiumModalSub}>Sblocca tutte le funzionalità</Text>

            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.mintGreen} />
                <Text style={styles.premiumFeatureText}>Figli illimitati</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.mintGreen} />
                <Text style={styles.premiumFeatureText}>Dashboard dettagliata</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.mintGreen} />
                <Text style={styles.premiumFeatureText}>Sincronizzazione tra genitori</Text>
              </View>
              <View style={styles.premiumFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.mintGreen} />
                <Text style={styles.premiumFeatureText}>Funzioni extra future</Text>
              </View>
            </View>

            <View style={styles.pricingCards}>
              <Pressable
                onPress={() => {
                  setPremium(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPremiumModal(false);
                  Alert.alert('Premium attivato!', 'Grazie per aver scelto Premium (demo).');
                }}
                style={({ pressed }) => [styles.pricingCard, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.pricingPeriod}>Mensile</Text>
                <Text style={styles.pricingPrice}>2 €</Text>
                <Text style={styles.pricingDetail}>/mese</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setPremium(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPremiumModal(false);
                  Alert.alert('Premium attivato!', 'Risparmi 4€ con il piano annuale (demo).');
                }}
                style={({ pressed }) => [styles.pricingCard, styles.pricingCardBest, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>-17%</Text>
                </View>
                <Text style={styles.pricingPeriod}>Annuale</Text>
                <Text style={styles.pricingPrice}>20 €</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.white,
  },
  profileSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  premiumBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  premiumTextWrap: {
    flex: 1,
  },
  premiumTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.white,
  },
  premiumSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.creamBeige,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsValue: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.danger,
  },
  footerText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
  footerSubtext: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  modalInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige,
    borderRadius: 16,
    padding: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.mintGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumModalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  premiumModalTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  premiumModalSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  premiumFeatures: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  premiumFeatureText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: Colors.creamBeige,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingCardBest: {
    borderColor: Colors.goldAccent,
    backgroundColor: '#FFF9E6',
  },
  bestValueBadge: {
    backgroundColor: Colors.goldAccent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    position: 'absolute',
    top: -10,
  },
  bestValueText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.white,
  },
  pricingPeriod: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  pricingPrice: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  pricingDetail: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  premiumCloseBtn: {
    paddingVertical: 12,
  },
  premiumCloseText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textMuted,
  },
});
