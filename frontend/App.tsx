import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StatusBar } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import BouncerRegistrationScreen from './src/screens/Bouncer/BouncerRegistrationScreen';
import VerificationPendingScreen from './src/screens/Bouncer/VerificationPendingScreen';
import BouncerHomeScreen from './src/screens/Bouncer/BouncerHomeScreen';
import BouncerHistoryScreen from './src/screens/Bouncer/BouncerHistoryScreen';
import BouncerProfileScreen from './src/screens/Bouncer/BouncerProfileScreen';
import BouncerSurveyScreen from './src/screens/Bouncer/BouncerSurveyScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BouncerDetailScreen from './src/screens/BouncerDetailScreen';
import BookingFlowScreen from './src/screens/BookingFlowScreen';

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
        background: '#0F0F0F',
        card: '#1E1E1E',
        text: '#ffffff',
        border: '#333333',
        primary: '#FFD700',
    },
};

const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
);

const HomeNavigator = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0F0F0F' } }}>
        <HomeStack.Screen name="BouncerList" component={HomeScreen} />
        <HomeStack.Screen name="BouncerDetail" component={BouncerDetailScreen} />
        <HomeStack.Screen name="BookingFlow" component={BookingFlowScreen} />
    </HomeStack.Navigator>
);

const MainNavigator = () => (
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
                backgroundColor: '#1E1E1E',
                borderTopWidth: 1,
                borderTopColor: '#333',
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
            },
            tabBarActiveTintColor: '#FFD700',
            tabBarInactiveTintColor: '#666',
            tabBarHideOnKeyboard: true,
        })}
    >
        <MainTab.Screen name="HomeStack" component={HomeNavigator} options={{ title: 'Hire Security' }} />
        <MainTab.Screen name="Bookings" component={BookingsScreen} options={{ title: 'Assignments' }} />
        <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Account' }} />
    </MainTab.Navigator>
);

const BouncerNavigator = () => (
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
                backgroundColor: '#1E1E1E',
                borderTopWidth: 1,
                borderTopColor: '#333',
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
            },
            tabBarActiveTintColor: '#FFD700',
            tabBarInactiveTintColor: '#666',
            tabBarHideOnKeyboard: true,
        })}
    >
        <BouncerTab.Screen name="BouncerHome" component={BouncerHomeScreen} options={{ title: 'Home' }} />
        <BouncerTab.Screen name="History" component={BouncerHistoryScreen} options={{ title: 'History' }} />
        <BouncerTab.Screen name="Profile" component={BouncerProfileScreen} options={{ title: 'Profile' }} />
    </BouncerTab.Navigator>
);

const AppContent = () => {
    const { token, isLoading, user, pendingBouncerRegistration } = useContext(AuthContext);

    if (isLoading) {
        return null;
    }

    const isBouncerFlow = user?.role === 'BOUNCER' || user?.role === 'GUNMAN' || !!user?.bouncerProfile;
    const isApproved = user?.bouncerProfile?.verificationStatus === 'APPROVED';

    return (
        <NavigationContainer theme={DarkTheme}>
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
                            isApproved ? (
                                <Stack.Screen name="BouncerMain" component={BouncerNavigator} />
                            ) : (
                                <Stack.Screen
                                    name="VerificationPending"
                                    component={VerificationPendingScreen}
                                    initialParams={{ userId: user?.id }}
                                />
                            )
                        ) : (
                            <Stack.Screen name="ClientMain" component={MainNavigator} />
                        )}

                        {/* Common screens that might be needed in either flow (like during registration) */}
                        {!pendingBouncerRegistration && (
                            <Stack.Screen name="BouncerRegistration" component={BouncerRegistrationScreen} />
                        )}
                        <Stack.Screen name="BouncerSurvey" component={BouncerSurveyScreen} options={{ headerShown: false }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
