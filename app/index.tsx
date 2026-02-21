import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth-context';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function IndexScreen() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, { duration: 800 });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      setShowSplash(false);
      if (!isAuthenticated) {
        router.replace('/auth');
      } else if (user && !user.isProfileComplete) {
        router.replace('/profile-completion');
      } else {
        router.replace('/(tabs)');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (!showSplash) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0FAF4', '#F8FEFA', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoContainer, logoAnimStyle]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={styles.brandName}>
            <Text style={styles.brandTarbiy}>Tarbiy</Text>
            <Text style={styles.brandApp}>App</Text>
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <Text style={styles.subtitle}>Educazione islamica dei tuoi figli</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(1200).duration(500)} style={styles.bottomDots}>
        <View style={[styles.dot, { backgroundColor: Colors.mintGreen }]} />
        <View style={[styles.dot, { backgroundColor: Colors.peachPink }]} />
        <View style={[styles.dot, { backgroundColor: Colors.skyBlue }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 38,
  },
  brandTarbiy: {
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.mintGreen,
    fontSize: 38,
  },
  brandApp: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textPrimary,
    fontSize: 38,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  bottomDots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
