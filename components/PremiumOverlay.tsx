import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useI18n } from '@/lib/i18n';
import Colors from '@/constants/colors';

interface PremiumOverlayProps {
  message: string;
  onDiscover: () => void;
  icon?: string;
}

export default function PremiumOverlay({ message, onDiscover, icon = 'lock-closed' }: PremiumOverlayProps) {
  const { t } = useI18n();

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon as any} size={28} color={Colors.mintGreenDark} />
        </View>
        <Text style={styles.message}>{message}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDiscover();
          }}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        >
          <Ionicons name="star" size={16} color={Colors.white} />
          <Text style={styles.btnText}>{t('discoverPremium')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 240, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 32,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    maxWidth: 320,
    width: '100%',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.mintGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.mintGreen,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.white,
  },
});
