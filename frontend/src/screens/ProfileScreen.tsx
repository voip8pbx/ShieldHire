import React, { useContext, useState } from 'react';
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
    PermissionsAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import api from '../services/api';
import Geolocation from 'react-native-geolocation-service';

export default function ProfileScreen() {
    const { user, logout, updateUser } = useContext(AuthContext);

    // State
    const [image, setImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [contact, setContact] = useState(user?.contactNo || '');
    const [locationName, setLocationName] = useState('Fetching...');

    // Update name if user context changes
    React.useEffect(() => {
        if (user?.name) setName(user.name);
    }, [user]);

    React.useEffect(() => {
        getCurrentLocation();
    }, []);

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
                                    headers: {
                                        'User-Agent': 'ShieldHireApp/1.0'
                                    }
                                });
                                const data = await response.json();
                                if (data && data.address) {
                                    const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown';
                                    const country = data.address.country || '';
                                    setLocationName(`${city}, ${country}`);
                                } else {
                                    setLocationName(`Lat: ${latitude.toFixed(2)}, Long: ${longitude.toFixed(2)}`);
                                }
                            } catch (err) {
                                console.log('Reverse geocoding error:', err);
                                setLocationName(`Location Unavailable`);
                            }
                        },
                        (error) => {
                            console.log(error.code, error.message);
                            setLocationName('Location Unavailable');
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                } else {
                    setLocationName('Permission Denied');
                }
            });
        } else {
            // Assume iOS doesn't need this explicit permission check here, or handle separately if requested later
            setLocationName('Location Unavailable');
        }
    };

    // Mock Data for display
    const membership = {
        name: 'Corporate Security Plan',
        renews: '2026-01-01',
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
                includeBase64: false,
                maxHeight: 500,
                maxWidth: 500,
                quality: 1,
            },
            (response: ImagePickerResponse) => {
                if (response.didCancel) {
                    return;
                } else if (response.errorCode) {
                    Alert.alert("Error", response.errorMessage || "Failed to pick image");
                } else if (response.assets && response.assets[0].uri) {
                    setImage(response.assets[0].uri);
                }
            }
        );
    };

    const toggleEdit = async () => {
        if (isEditing) {
            // Save logic
            try {
                const response = await api.put('/user/profile', {
                    name,
                    contactNo: contact,
                    profilePhoto: image
                });

                if (response.data) {
                    updateUser(response.data.user);
                    Alert.alert("Profile Saved", "Client details updated.");
                }
            } catch (error: any) {
                console.error("Save profile error", error);
                Alert.alert("Error", error.message || "Failed to save profile");
                // Don't toggle edit mode if failed?
                // For now, let's keep it open so they can retry
                return;
            }
        }
        setIsEditing(!isEditing);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={{ backgroundColor: '#1E1E1E' }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {user?.role === 'BOUNCER' || user?.role === 'GUNMAN' ? 'Security Profile' : 'Client Profile'}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1, backgroundColor: '#0F0F0F' }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Profile Card */}
                <View style={[styles.card, styles.profileCard]}>
                    <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.avatarContainer}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.avatarText}>
                                    {name ? name.charAt(0).toUpperCase() : 'C'}
                                </Text>
                            </View>
                        )}
                        {isEditing && (
                            <View style={styles.editIconBadge}>
                                <Ionicons name="camera" size={14} color="#000" />
                            </View>
                        )}
                    </TouchableOpacity>

                    {isEditing ? (
                        <TextInput
                            style={[styles.userNameInput]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Client Name"
                            placeholderTextColor="#666"
                        />
                    ) : (
                        <Text style={styles.userName}>{name}</Text>
                    )}

                    <Text style={styles.userEmail}>{user?.email || 'client@company.com'}</Text>

                    {/* Contact Number */}
                    <View style={styles.contactContainer}>
                        {isEditing ? (
                            <TextInput
                                style={styles.contactInput}
                                value={contact}
                                onChangeText={setContact}
                                placeholder="Contact Number"
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={styles.contactText}>{contact || '+91 98765 43210'}</Text>
                        )}
                    </View>

                    {/* Location Info */}
                    <View style={styles.statsRow}>
                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.statValue}>{locationName}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.actionBtn, isEditing ? styles.saveBtn : styles.editBtn]}
                        onPress={toggleEdit}
                    >
                        <Text style={[styles.btnText, isEditing && styles.saveBtnText]}>
                            {isEditing ? 'Save Details' : 'Edit Profile'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Membership */}
                {/* Membership - Client Only */}
                {user?.role !== 'BOUNCER' && user?.role !== 'GUNMAN' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Membership Plan</Text>
                        <Text style={styles.planName}>{membership.name}</Text>
                        <Text style={styles.renewText}>Valid until: {membership.renews}</Text>

                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>{membership.status}</Text>
                        </View>

                        <TouchableOpacity style={styles.manageBtn}>
                            <Text style={styles.manageBtnText}>Upgrade Plan</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Hiring Preferences - Client Only */}
                {user?.role !== 'BOUNCER' && user?.role !== 'GUNMAN' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Hiring Preferences</Text>
                        <View style={styles.prefGrid}>
                            {preferences.map((pref, index) => (
                                <View key={index} style={styles.prefPill}>
                                    <MaterialCommunityIcons name={pref.icon as any} size={16} color="#ccc" />
                                    <Text style={styles.prefText}>{pref.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Settings Menu */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="card-outline" size={22} color="#ccc" />
                            <Text style={styles.menuText}>Payment Methods</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#ccc" />
                            <Text style={styles.menuText}>Verification Status</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={logout}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
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
        backgroundColor: '#1E1E1E', // Match header color for top safe area
    },
    header: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    profileCard: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    placeholderAvatar: {
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFD700',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#888',
        marginBottom: 20,
    },
    userNameInput: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        paddingVertical: 2,
        minWidth: 150,
        textAlign: 'center',
    },
    contactContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    contactText: {
        fontSize: 16,
        color: '#ddd',
        fontWeight: '500',
    },
    contactInput: {
        fontSize: 16,
        color: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        paddingVertical: 2,
        minWidth: 120,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        justifyContent: 'center',
    },
    statInputGroup: {
        alignItems: 'center',
        minWidth: 100,
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        minWidth: 80,
        textAlign: 'center',
        fontSize: 16,
        color: '#fff',
        paddingVertical: 2,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#444',
        marginHorizontal: 20,
    },
    actionBtn: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    editBtn: {
        borderColor: '#FFD700',
        backgroundColor: 'transparent',
    },
    saveBtn: {
        borderColor: '#FFD700',
        backgroundColor: '#FFD700',
    },
    btnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFD700',
    },
    saveBtnText: {
        color: '#000',
    },
    // Subscription
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    planName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFD700',
        marginBottom: 4,
    },
    renewText: {
        fontSize: 13,
        color: '#888',
        marginBottom: 12,
    },
    activeBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    activeText: {
        fontSize: 12,
        color: '#FFD700',
        fontWeight: '600',
    },
    manageBtn: {
        backgroundColor: '#333',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    manageBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Preferences
    prefGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    prefPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    prefText: {
        fontSize: 12,
        color: '#ddd',
        marginLeft: 6,
        fontWeight: '500',
    },
    // Menu
    menuContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 15,
        color: '#ddd',
        marginLeft: 12,
        fontWeight: '500',
    },
});
