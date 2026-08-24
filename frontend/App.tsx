import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StatusBar, Platform } from 'react-native';
import { setNavigationRef, checkInitialNotification } from './src/services/fcmService';
import BootSplash from 'react-native-bootsplash';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import AnimatedSplashScreen from './src/screens/AnimatedSplashScreen';
import BouncerRegistrationScreen from './src/screens/Bouncer/BouncerRegistrationScreen';
import VerificationPendingScreen from './src/screens/Bouncer/VerificationPendingScreen';
import BouncerHomeScreen from './src/screens/Bouncer/BouncerHomeScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import BouncerHistoryScreen from './src/screens/Bouncer/BouncerHistoryScreen';
import BouncerProfileScreen from './src/screens/Bouncer/BouncerProfileScreen';
import BouncerSurveyScreen from './src/screens/Bouncer/BouncerSurveyScreen';
import BouncerBookingDetailScreen from './src/screens/BouncerBookingDetailScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BouncerDetailScreen from './src/screens/BouncerDetailScreen';
import BookingDetailsScreen from './src/screens/BookingDetailsScreen';
import ChatScreen from './src/screens/ChatScreen';

import BookingFlowScreen from './src/screens/BookingFlowScreen';
import MapScreen from './src/screens/MapScreen';
import ClientVerificationPendingScreen from './src/screens/ClientVerificationPendingScreen';
import ClientProfileSetupScreen from './src/screens/ClientProfileSetupScreen';
import { notificationService } from './src/services/notificationService';

import { RootStackParamList, AuthStackParamList, MainTabParamList, HomeStackParamList, BouncerTabParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const BouncerTab = createBottomTabNavigator<BouncerTabParamList>();

const DarkTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: '#070708',
        card: '#121214',
        text: '#ffffff',
        border: 'rgba(255, 255, 255, 0.04)',
        primary: '#FFD700',
    },
};

const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#070708' } }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
);
import ExploreProfessionalsScreen from './src/screens/ExploreProfessionalsScreen';
import ContactUsScreen from './src/screens/ContactUsScreen';
import PaymentScreen from './src/screens/PaymentScreen';

const HomeNavigator = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#070708' } }}>
        <HomeStack.Screen name="BouncerList" component={HomeScreen} />
        <HomeStack.Screen name="ExploreProfessionals" component={ExploreProfessionalsScreen} />
        <HomeStack.Screen name="BouncerDetail" component={BouncerDetailScreen} />
        <HomeStack.Screen name="ContactUs" component={ContactUsScreen} />

        <HomeStack.Screen name="BookingFlow" component={BookingFlowScreen} />
        <HomeStack.Screen name="PaymentScreen" component={PaymentScreen} />
        <HomeStack.Screen name="MapScreen" component={MapScreen} />
    </HomeStack.Navigator>
);

const MainNavigator = () => {
    const { colors } = useContext(ThemeContext);
    return (
        <MainTab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any = 'shield';

                    if (route.name === 'HomeStack') {
                        iconName = focused ? 'shield' : 'shield-outline';
                    } else if (route.name === 'Bookings') {
                        iconName = focused ? 'file-tray-full' : 'file-tray-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 28 : 20,
                    left: 16,
                    right: 16,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    height: 68,
                    borderRadius: 24,
                    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
                    paddingTop: 8,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                    elevation: 5,
                },
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginBottom: Platform.OS === 'ios' ? 0 : 4,
                },
                tabBarActiveTintColor: colors.gold,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarHideOnKeyboard: true,
            })}
        >
            <MainTab.Screen name="HomeStack" component={HomeNavigator} options={{ title: 'Hire' }} />
            <MainTab.Screen name="Bookings" component={BookingsScreen} options={{ title: 'Bookings' }} />
            <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        </MainTab.Navigator>
    );
};

const BouncerNavigator = () => {
    const { colors } = useContext(ThemeContext);
    return (
        <BouncerTab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any = 'shield';

                    if (route.name === 'BouncerHome') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'History') {
                        iconName = focused ? 'file-tray-full' : 'file-tray-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 28 : 20,
                    left: 16,
                    right: 16,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    height: 68,
                    borderRadius: 24,
                    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
                    paddingTop: 8,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                    elevation: 5,
                },
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginBottom: Platform.OS === 'ios' ? 0 : 4,
                },
                tabBarActiveTintColor: colors.gold,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarHideOnKeyboard: true,
            })}
        >
            <BouncerTab.Screen name="BouncerHome" component={BouncerHomeScreen} options={{ title: 'Dashboard' }} />
            <BouncerTab.Screen name="History" component={BouncerHistoryScreen} options={{ title: 'Assignments' }} />
            <BouncerTab.Screen name="Profile" component={BouncerProfileScreen} options={{ title: 'Profile' }} />
        </BouncerTab.Navigator>
    );
};

const AppContent = () => {
    const { token, isLoading, user, pendingBouncerRegistration } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const navigationRef = useRef<NavigationContainerRef<any>>(null);
    const [isSplashAnimationComplete, setSplashAnimationComplete] = useState(false);

    // Pass navigation ref to FCM service so it can deep-link from notifications
    useEffect(() => {
        if (navigationRef.current) {
            setNavigationRef(navigationRef.current);
        }
    }, [navigationRef.current]);

    // Check if the app was launched by tapping a notification in killed state
    useEffect(() => {
        checkInitialNotification();
    }, []);

    if (isLoading || !isSplashAnimationComplete) {
        return (
            <AnimatedSplashScreen 
                isAppLoaded={!isLoading}
                onAnimationComplete={() => setSplashAnimationComplete(true)}
            />
        );
    }

    // A user is a bouncer if they have the role OR they have a profile record.
    const isBouncerFlow =
        user?.role === 'BOUNCER' ||
        user?.role === 'GUNMAN' ||
        (user?.bouncerProfile !== null && user?.bouncerProfile !== undefined);

    const isApproved = user?.bouncerProfile?.verificationStatus === 'APPROVED';
    const isClientApproved =
        user?.role === 'USER' ||
        user?.role === 'ADMIN' ||
        user?.clientProfile?.verificationStatus === 'APPROVED';

    console.log(`[AppNavigation] User: ${user?.email}, Role: ${user?.role}, isBouncer: ${isBouncerFlow}, bouncerApproved: ${isApproved}, clientApproved: ${isClientApproved}`);

    const navigationTheme = theme === 'dark' ? DarkTheme : {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: '#F5F5F7',
            card: '#FFFFFF',
            text: '#000000',
            border: '#E5E5EA',
            primary: '#D4AF37',
        }
    };

    return (
        <NavigationContainer 
            ref={navigationRef} 
            theme={navigationTheme}
            onReady={() => {
                BootSplash.hide({ fade: true });
            }}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!token ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    <>
                        {pendingBouncerRegistration ? (
                            <Stack.Screen
                                name="BouncerRegistration"
                                component={BouncerRegistrationScreen}
                                initialParams={pendingBouncerRegistration}
                            />
                        ) : isBouncerFlow ? (
                            <>
                                {!user?.bouncerProfile?.bio ? (
                                    <Stack.Screen name="BouncerSurvey" component={BouncerSurveyScreen} options={{ headerShown: false }} />
                                ) : !isApproved ? (
                                    <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} options={{ headerShown: false }} />
                                ) : (
                                    <Stack.Screen name="BouncerMain" component={BouncerNavigator} />
                                )}
                                {user?.bouncerProfile?.bio && isApproved && (
                                    <Stack.Screen name="BouncerSurvey" component={BouncerSurveyScreen} options={{ headerShown: false }} />
                                )}
                            </>
                        ) : (
                            !isClientApproved ? (
                                <>
                                    {!user?.clientProfile ? (
                                        <Stack.Screen name="ClientProfileSetup" component={ClientProfileSetupScreen} options={{ headerShown: false }} />
                                    ) : (
                                        <>
                                            <Stack.Screen name="ClientVerificationPending" component={ClientVerificationPendingScreen} options={{ headerShown: false }} />
                                            <Stack.Screen name="ClientProfileSetup" component={ClientProfileSetupScreen} options={{ headerShown: false }} />
                                        </>
                                    )}
                                </>
                            ) : (
                                <Stack.Screen name="ClientMain" component={MainNavigator} />
                            )
                        )}

                        {/* Common screens that might be needed in either flow (like during registration) */}
                        {!pendingBouncerRegistration && !isBouncerFlow && (
                            <Stack.Screen name="BouncerRegistration" component={BouncerRegistrationScreen} />
                        )}
                        <Stack.Screen name="BouncerBookingDetail" component={BouncerBookingDetailScreen} />
                        <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="Notifications" component={NotificationScreen} options={{ headerShown: false }} />

                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
