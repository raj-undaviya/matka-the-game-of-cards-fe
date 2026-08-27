// SplashScreen.js
import React, { useEffect, useRef, useContext } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { AuthContext } from '../context/AuthContext';

export default function SplashScreen({ navigation }) {
  const { user, isLoading } = useContext(AuthContext);
  const hasVideoFinished = useRef(false);
  const hasNavigated = useRef(false);

  const navigateToNextScreen = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.replace(user ? 'Home' : 'Login');
  };

  // If Auth finishes loading after video has completed, navigate immediately
  useEffect(() => {
    if (!isLoading && hasVideoFinished.current) {
      navigateToNextScreen();
    }
  }, [isLoading, user]);

  // Fallback timer (e.g. 6.5 seconds) in case video playback status update doesn't fire or video fails to load
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      hasVideoFinished.current = true;
      if (!isLoading) {
        navigateToNextScreen();
      }
    }, 13000);

    return () => clearTimeout(fallbackTimer);
  }, [isLoading, user]);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      hasVideoFinished.current = true;
      if (!isLoading) {
        navigateToNextScreen();
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Video
        source={require('../assets/images/splash_screen.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(error) => {
          console.error('Splash video play error:', error);
          // On video error, proceed directly to app navigation
          hasVideoFinished.current = true;
          if (!isLoading) {
            navigateToNextScreen();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});