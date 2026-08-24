import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    TextInput,
    Alert,
    Platform,
    PermissionsAndroid,
    ActivityIndicator,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import api from '../services/api';
import Geolocation from 'react-native-geolocation-service';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

export default function ProfileScreen() {
    const { user, token, logout, updateUser, pendingRoute, consumePendingRoute, requireAuth } = useContext(AuthContext);
    const { theme, toggleTheme, colors } = useContext(ThemeContext);
    const navigation = useNavigation<any>();

    // State
    const [image, setImage] = useState<string | null>(user?.profilePhoto || null);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [contact, setContact] = useState(user?.contactNo || '');
    const [upiId, setUpiId] = useState(user?.bouncerProfile?.upiId || '');
    const [locationName, setLocationName] = useState('Fetching...');
    const [locationPermissionStatus, setLocationPermissionStatus] = useState<'Granted' | 'Denied' | 'Not Determined'>('Not Determined');
    const [saving, setSaving] = useState(false);

    // Update state if user context changes
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setContact(user.contactNo || '');
            setImage(user.profilePhoto || null);
            setUpiId(user.bouncerProfile?.upiId || '');
        }
    }, [user]);

    useEffect(() => {
        getCurrentLocation();
        checkLocationPermission();
    }, []);

    const checkLocationPermission = async () => {
        if (Platform.OS === 'android') {
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            setLocationPermissionStatus(hasPermission ? 'Granted' : 'Denied');
        } else {
            setLocationPermissionStatus('Granted');
        }
    };

    const handleLocationPermissionPress = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission Required",
                        message: "ShieldHire needs access to your location for emergency SOS and security coverage.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setLocationPermissionStatus('Granted');
                    Alert.alert("Permission Granted", "Location access is active.");
                    getCurrentLocation();
                } else {
                    setLocationPermissionStatus('Denied');
                    Alert.alert(
                        'Permission Required',
                        'Location permission is denied. Please enable it in app settings.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() }
                        ]
                    );
                }
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const getCurrentLocation = () => {
        if (Platform.OS === 'android') {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(granted => {
                if (granted) {
                    setLocationName('Locating...');
                    Geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            try {
                                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                                    headers: { 'User-Agent': 'ShieldOfSecurityApp/1.0' }
                                });
                                const data = await response.json();
                                if (data && data.address) {
                                    const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown';
                                    const country = data.address.country || '';
                                    setLocationName(`${city}, ${country}`);
                                } else {
                                    setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
                                }
                            } catch (err) {
                                setLocationName(`Location Unavailable`);
                            }
                        },
                        () => setLocationName('Location Unavailable'),
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                } else {
                    setLocationName('Permission Denied');
                }
            });
        } else {
            setLocationName('Location Active');
        }
    };

    const membership = {
        name: 'Corporate Security Plan',
        renews: '2026-12-31',
        status: 'Active'
    };

    const preferences = [
        { icon: 'shield-account', label: 'Armed Guards' },
        { icon: 'account-tie', label: 'VIP Protection' },
        { icon: 'clock-outline', label: '24/7 Coverage' },
        { icon: 'file-document', label: 'NDAs Required' }
    ];

    const pickImage = async () => {
        if (!isEditing) return;

        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true,
                maxHeight: 500,
                maxWidth: 500,
                quality: 0.8,
            },
            (response: ImagePickerResponse) => {
                if (response.didCancel) {
                    return;
                } else if (response.errorCode) {
                    Alert.alert("Error", response.errorMessage || "Failed to pick image");
                } else if (response.assets && response.assets[0].base64) {
                    const dataUri = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
                    setImage(dataUri);
                } else if (response.assets && response.assets[0].uri) {
                    setImage(response.assets[0].uri);
                }
            }
        );
    };

    const toggleEdit = async () => {
        if (!token || token === 'guest_token') {
            requireAuth(navigation, 'Profile');
            return;
        }
        if (isEditing) {
            setSaving(true);
            try {
                let profilePhotoUrl = image;
                if (image && image.startsWith('data:')) {
                    const uploadResponse = await api.post('/upload', {
                        image: image,
                        filename: `client-${user?.id || Date.now()}.jpg`,
                        folder: 'profile-photos'
                    });
                    if (uploadResponse.data && uploadResponse.data.url) {
                        profilePhotoUrl = uploadResponse.data.url;
                        setImage(profilePhotoUrl);
                    }
                }

                const payload: any = {
                    name,
                    contactNo: contact,
                    profilePhoto: profilePhotoUrl
                };

                if (user?.role === 'BOUNCER' || user?.role === 'GUNMAN') {
                    payload.bouncerProfile = { upiId };
                }

                const response = await api.put('/user/profile', payload);

                if (response.data && response.data.user) {
                    updateUser(response.data.user);
                    if (pendingRoute) {
                        consumePendingRoute(navigation);
                    } else {
                        Alert.alert("Profile Saved", "Your profile details have been updated.");
                    }
                }
            } catch (error: any) {
                console.error("Save profile error", error);
                const errorMsg = error.response?.data?.error || error.message;
                if (errorMsg === 'Invalid token.') {
                    Alert.alert("Session Expired", "Your session has expired. Please log in again to save changes.", [
                        { text: "Log In", onPress: () => requireAuth(navigation, 'Profile') },
                        { text: "Cancel", style: "cancel" }
                    ]);
                } else {
                    Alert.alert("Error", errorMsg || "Failed to save profile");
                }
                setSaving(false);
                return;
            } finally {
                setSaving(false);
            }
        }
        setIsEditing(!isEditing);
    };

    const BG = '#121214';
    const CARD_BG = '#1A1A1E';
    const GOLD = '#FFD700';
    const BORDER = 'rgba(255,255,255,0.08)';

    const cleanDisplayName = (name || user?.name || 'Client User').replace(/\s+\d{10,}$/, '');

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ backgroundColor: '#0A0A0A' }}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {navigation.canGoBack() && (
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
                                <Ionicons name="chevron-back" size={22} color="#fff" />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.headerTitle}>
                            {user?.role === 'BOUNCER' || user?.role === 'GUNMAN' ? 'Security Profile' : 'Client Profile'}
                        </Text>
                    </View>

                    {isEditing ? (
                        <TouchableOpacity style={styles.saveHeaderBtn} onPress={toggleEdit} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveHeaderBtnText}>Save</Text>}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.editHeaderBtn} onPress={toggleEdit}>
                            <Ionicons name="create-outline" size={18} color="#FFD700" />
                        </TouchableOpacity>
                    )}

                </View>
            </View>

            <ScrollView
                style={{ flex: 1, backgroundColor: BG }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Premium Profile Card */}
                <View style={styles.premiumProfileCard}>
                    <View style={styles.profileHeaderLayout}>
                        <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.avatarContainer}>
                            {image || user?.profilePhoto ? (
                                <Image source={{ uri: image || user?.profilePhoto }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatar]}>
                                    <Text style={styles.avatarText}>
                                        {cleanDisplayName ? cleanDisplayName.charAt(0).toUpperCase() : 'C'}
                                    </Text>
                                </View>
                            )}
                            {isEditing && (
                                <View style={styles.editIconBadge}>
                                    <Ionicons name="camera" size={14} color="#000" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.profileInfoLayout}>
                            {isEditing ? (
                                <TextInput
                                    style={styles.userNameInput}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Full Name"
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.userName}>{cleanDisplayName}</Text>
                            )}
                            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>


                            {/* Verification Badge */}
                            <View style={[styles.verificationBadge, styles.verificationApprovedBadge]}>
                                <MaterialCommunityIcons name="check-decagram" size={14} color="#000" />
                                <Text style={styles.verificationText}>Verified Client</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.dividerHorizontal} />

                    {/* Contact Number & Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Contact Number</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={contact}
                                    onChangeText={setContact}
                                    placeholder="Contact"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                />
                            ) : (
                                <Text style={styles.statValue}>{contact || 'Not Provided'}</Text>
                            )}
                        </View>

                        <View style={styles.dividerVertical} />

                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.statValue} numberOfLines={1}>{locationName}</Text>
                        </View>

                        <View style={styles.dividerVertical} />

                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Status</Text>
                            <Text style={[styles.statValue, { color: GOLD }]}>VIP Active</Text>
                        </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.actionBtn, isEditing ? styles.saveBtn : styles.editBtn]}
                        onPress={() => {
                            if (token === 'guest_token') {
                                requireAuth(navigation, 'Profile');
                            } else {
                                toggleEdit();
                            }
                        }}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={isEditing ? "#000" : GOLD} />
                        ) : (
                            <Text style={[styles.btnText, isEditing ? styles.saveBtnText : styles.editBtnText]}>
                                {isEditing ? 'Save Profile Details' : 'Edit Profile'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Membership Plan Card */}
                {user?.role !== 'BOUNCER' && user?.role !== 'GUNMAN' && (
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <MaterialCommunityIcons name="shield-crown" size={20} color={GOLD} />
                            <Text style={styles.cardTitle}>Membership Plan</Text>
                        </View>
                        <Text style={styles.planName}>{membership.name}</Text>
                        <Text style={styles.renewText}>Valid through: {membership.renews}</Text>

                        <View style={styles.activeBadge}>
                            <View style={styles.greenDot} />
                            <Text style={styles.activeText}>{membership.status}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.manageBtn}
                            onPress={() => requireAuth(navigation, 'Profile')}
                        >
                            <Text style={styles.manageBtnText}>Upgrade Security Plan</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Hiring Preferences Card */}
                {user?.role !== 'BOUNCER' && user?.role !== 'GUNMAN' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Hiring Preferences</Text>
                        <View style={styles.prefGrid}>
                            {preferences.map((pref, index) => (
                                <View key={index} style={styles.prefPill}>
                                    <MaterialCommunityIcons name={pref.icon as any} size={15} color={GOLD} />
                                    <Text style={styles.prefText}>{pref.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Settings Menu */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            if (user?.role === 'BOUNCER' || user?.role === 'GUNMAN') {
                                Alert.alert('Payment Profile', `Registered UPI ID: ${user?.bouncerProfile?.upiId || 'Not Configured'}`);
                            } else {
                                Alert.alert('Payment Methods', 'Manage your cards, UPI, and payment methods for instant guard bookings.');
                            }
                        }}
                    >
                        <View style={styles.menuLeft}>
                            <Ionicons name="card-outline" size={20} color="#ccc" />
                            <Text style={styles.menuText}>Payment Methods</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLocationPermissionPress}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="location-outline" size={20} color="#ccc" />
                            <Text style={styles.menuText}>Location Permission</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{
                                color: locationPermissionStatus === 'Granted' ? '#4CD964' : '#FF3B30',
                                marginRight: 8,
                                fontSize: 12,
                                fontWeight: '600'
                            }}>
                                {locationPermissionStatus}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#666" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
                        <View style={styles.menuLeft}>
                            <Ionicons name={theme === 'dark' ? "moon-outline" : "sunny-outline"} size={20} color="#ccc" />
                            <Text style={styles.menuText}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                        </View>
                        <Ionicons name="color-palette-outline" size={18} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ContactUs')}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="chatbubbles-outline" size={20} color="#ccc" />
                            <Text style={styles.menuText}>Contact Support</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={logout}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                            <Text style={[styles.menuText, { color: '#FF3B30' }]}>Logout</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121214',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#0A0A0A',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    backBtnHeader: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    editHeaderBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A1A1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    saveHeaderBtn: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 14,
    },
    saveHeaderBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '800',
    },

    scrollContent: {
        padding: 16,
        paddingBottom: 140,
    },
    premiumProfileCard: {

        backgroundColor: '#1A1A1E',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        elevation: 4,
    },
    profileHeaderLayout: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 2,
        borderColor: '#D4AF37',
    },
    placeholderAvatar: {
        backgroundColor: '#2A2A2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#D4AF37',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#D4AF37',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfoLayout: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    userNameInput: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#D4AF37',
        paddingVertical: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#888',
        marginBottom: 8,
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 4,
    },
    verificationApprovedBadge: {
        backgroundColor: '#D4AF37',
    },
    verificationText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
    },
    dividerHorizontal: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginVertical: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statInputGroup: {
        flex: 1,
        alignItems: 'center',
    },
    label: {
        fontSize: 11,
        color: '#777',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#D4AF37',
        width: '100%',
        textAlign: 'center',
        fontSize: 13,
        color: '#fff',
        paddingVertical: 2,
    },
    dividerVertical: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    actionBtn: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    editBtn: {
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
    },
    saveBtn: {
        borderColor: '#D4AF37',
        backgroundColor: '#D4AF37',
    },
    btnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    editBtnText: {
        color: '#D4AF37',
    },
    saveBtnText: {
        color: '#000',
    },
    card: {
        backgroundColor: '#1A1A1E',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 10,
    },
    planName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#D4AF37',
        marginBottom: 4,
    },
    renewText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 12,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    greenDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
    },
    activeText: {
        fontSize: 11,
        color: '#D4AF37',
        fontWeight: '700',
    },
    manageBtn: {
        backgroundColor: '#25252A',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    manageBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    prefGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    prefPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#25252A',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    prefText: {
        fontSize: 12,
        color: '#ccc',
        fontWeight: '500',
    },
    menuContainer: {
        backgroundColor: '#1A1A1E',
        borderRadius: 18,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuText: {
        fontSize: 14,
        color: '#ddd',
        fontWeight: '500',
    },
});
