import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BootSplash from 'react-native-bootsplash';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
    onAnimationComplete: () => void;
    isAppLoaded: boolean;
}

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onAnimationComplete, isAppLoaded }) => {
    const insets = useSafeAreaInsets();
    const [animationsDone, setAnimationsDone] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    
    const glowOpacityAnim = useRef(new Animated.Value(0)).current;
    
    const pulseScaleAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacityAnim = useRef(new Animated.Value(0)).current;
    
    const shineTranslateX = useRef(new Animated.Value(-width)).current;
    const progressTranslateX = useRef(new Animated.Value(-width)).current;

    useEffect(() => {
        // Hide the native splash screen immediately when this component mounts
        BootSplash.hide({ fade: true });

        // Start the sequence
        Animated.sequence([
            // Step 1: Fade In
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
            // Step 2: Scale with Spring
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
            // Step 3, 4, 5: Parallel Glow, Pulse, and Shine
            Animated.parallel([
                // Glow appears
                Animated.timing(glowOpacityAnim, {
                    toValue: 0.15,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                // Pulse effect
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseOpacityAnim, {
                            toValue: 0.4,
                            duration: 300,
                            useNativeDriver: true,
                            easing: Easing.out(Easing.ease),
                        }),
                        Animated.timing(pulseScaleAnim, {
                            toValue: 1.6,
                            duration: 1000,
                            useNativeDriver: true,
                            easing: Easing.out(Easing.ease),
                        }),
                    ]),
                    Animated.timing(pulseOpacityAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ]),
                // Shine Sweep
                Animated.timing(shineTranslateX, {
                    toValue: width,
                    duration: 1200,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ]),
        ]).start(() => {
            setAnimationsDone(true);
        });

        // Infinite loading bar animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(progressTranslateX, {
                    toValue: width,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(progressTranslateX, {
                    toValue: -width,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // When both conditions are met, trigger completion
    useEffect(() => {
        if (animationsDone && isAppLoaded) {
            // Optional: Add a slight fade out of the entire splash screen before calling onAnimationComplete
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                onAnimationComplete();
            });
        }
    }, [animationsDone, isAppLoaded, onAnimationComplete, fadeAnim]);

    return (
        <LinearGradient
            colors={['#111111', '#222222']}
            style={styles.container}
        >
            <View style={[styles.contentContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                
                <View style={styles.centerGroup}>
                    {/* Logo and Effects Container */}
                    <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                        
                        {/* Golden Glow Background */}
                        <Animated.View style={[styles.glow, { opacity: glowOpacityAnim }]} />
                        
                        {/* Pulse Ring */}
                        <Animated.View style={[
                            styles.pulseRing, 
                            { 
                                opacity: pulseOpacityAnim, 
                                transform: [{ scale: pulseScaleAnim }] 
                            }
                        ]} />
                        
                        <Animated.Image 
                            source={require('../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Text Section */}
                    <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                        <View style={styles.appNameWrapper}>
                            <Text style={styles.appName}>Shield Of Security</Text>
                            {/* Shine effect over text */}
                            <Animated.View style={[styles.shineWrapper, { transform: [{ translateX: shineTranslateX }] }]}>
                                <LinearGradient
                                    colors={['rgba(255,215,0,0)', 'rgba(255,255,255,0.4)', 'rgba(255,215,0,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.shineGradient}
                                />
                            </Animated.View>
                        </View>
                        <Text style={styles.tagline}>Trusted Security Professionals</Text>
                    </Animated.View>
                </View>

                {/* Premium Loading Indicator */}
                <Animated.View style={[styles.loaderContainer, { opacity: fadeAnim }]}>
                    <Animated.View style={[styles.loaderLine, { transform: [{ translateX: progressTranslateX }] }]} />
                </Animated.View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    centerGroup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 140,
        height: 140,
        zIndex: 10,
    },
    glow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#F4B400',
        shadowColor: '#F4B400',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 50,
        elevation: 20,
    },
    pulseRing: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 2,
        borderColor: '#F4B400',
    },
    textContainer: {
        alignItems: 'center',
    },
    appNameWrapper: {
        overflow: 'hidden',
        paddingBottom: 5,
    },
    appName: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
    },
    shineWrapper: {
        ...StyleSheet.absoluteFillObject,
        width: 100, // Width of the shine beam
    },
    shineGradient: {
        flex: 1,
        transform: [{ skewX: '-20deg' }],
    },
    tagline: {
        color: '#AAAAAA',
        fontSize: 14,
        letterSpacing: 1,
        fontWeight: '500',
    },
    loaderContainer: {
        width: '80%',
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 40,
    },
    loaderLine: {
        width: '40%',
        height: '100%',
        backgroundColor: '#F4B400',
        borderRadius: 2,
        shadowColor: '#F4B400',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default AnimatedSplashScreen;
