import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const onLayoutRootView = useCallback(async () => {
    if (appReady) return;
    setAppReady(true);
    await SplashScreen.hideAsync();
  }, [appReady]);

  useEffect(() => {
    if (!appReady) return;

    // Logo: scale spring + fade in (600ms)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Texts: fade in with 300ms delay (400ms duration)
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 400,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Wait for animations + 800ms, then fade out
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setSplashDone(true));
    }, 1400);

    return () => clearTimeout(timer);
  }, [appReady]);

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>

        {!splashDone && (
          <Animated.View style={[styles.splash, { opacity: screenOpacity }]} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}>
              <Image source={require('./assets/adaptive-icon.png')} style={styles.logo} />
            </Animated.View>
            <Animated.Text style={[styles.title, { opacity: textOpacity }]}>PetStock</Animated.Text>
            <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>
              Gestión de inventario
            </Animated.Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logo: { width: 120, height: 120, resizeMode: 'contain' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 20 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 6 },
});
