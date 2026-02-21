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
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';

export default function BouncerProfileScreen() {
    const { user, logout, updateUser } = useContext(AuthContext);
    const navigation = useNavigation<any>();

    // State
    const [image, setImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // User Basic Info
    const [name, setName] = useState(user?.name || '');
    const [contact, setContact] = useState(user?.contactNo || '');

    // Bouncer Specific Info
    const [age, setAge] = useState<string>(user?.bouncerProfile?.age?.toString() || '');
    const [gender, setGender] = useState(user?.bouncerProfile?.gender || '');
    const [registrationType, setRegistrationType] = useState(user?.bouncerProfile?.registrationType || '');
    const [agencyCode, setAgencyCode] = useState(user?.bouncerProfile?.agencyReferralCode || '');
    const [locationPermissionStatus, setLocationPermissionStatus] = useState<'Granted' | 'Denied' | 'Not Determined'>('Not Determined');

    // Update state if user context changes
    // Fetch latest profile data
    const fetchProfile = async () => {
        try {
            const response = await api.get('/user/profile');
            if (response.data) {
                const userData = response.data;
                updateUser(userData); // Update context

                // Update local state
                setName(userData.name);
                setContact(userData.contactNo || '');
                if (userData.bouncerProfile) {
                    setAge(userData.bouncerProfile.age?.toString() || '');
                    setGender(userData.bouncerProfile.gender || '');
                    setRegistrationType(userData.bouncerProfile.registrationType || '');
                    setAgencyCode(userData.bouncerProfile.agencyReferralCode || '');
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    useEffect(() => {
        fetchProfile();
        checkLocationPermission();
    }, []);

    const checkLocationPermission = async () => {
        if (Platform.OS === 'android') {
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            setLocationPermissionStatus(hasPermission ? 'Granted' : 'Denied');
        } else {
            // iOS logic or other platforms if needed
            setLocationPermissionStatus('Not Determined');
        }
    };

    const handleLocationPermissionPress = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission Required",
                        message: "ShieldHire needs access to your location for verification and SOS features.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setLocationPermissionStatus('Granted');
                    Alert.alert("Permission Granted", "Location access has been enabled.");
                } else {
                    if (locationPermissionStatus === 'Denied') {
                        Alert.alert(
                            'Permission Required',
                            'Location permission is denied. Please enable it in app settings.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Open Settings', onPress: () => Linking.openSettings() }
                            ]
                        );
                    } else {
                        setLocationPermissionStatus('Denied');
                    }
                }
            } catch (err) {
                console.warn(err);
            }
        }
    };

    // Update state if user context changes (e.g. from other screens or after update)
    useEffect(() => {
        if (user) {
            setName(user.name);
            setContact(user.contactNo || '');
            if (user.bouncerProfile) {
                setAge(user.bouncerProfile.age?.toString() || '');
                setGender(user.bouncerProfile.gender || '');
                setRegistrationType(user.bouncerProfile.registrationType || '');
                setAgencyCode(user.bouncerProfile.agencyReferralCode || '');
            }
        }
    }, [user]);

    const pickImage = async () => {
        if (!isEditing) return;

        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true, // Enable base64
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
                    // Create data URI
                    const source = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
                    setImage(source);
                } else if (response.assets && response.assets[0].uri) {
                    // Fallback to URI if base64 missing for some reason
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
                    profilePhoto: image || user?.profilePhoto, // Send image if changed
                    bouncerProfile: {
                        age,
                        gender,
                        registrationType,
                        agencyReferralCode: agencyCode
                    }
                });

                if (response.data && response.data.user) {
                    updateUser(response.data.user);
                    Alert.alert("Profile Saved", "Your details have been updated.");
                }
            } catch (error: any) {
                console.error("Save profile error", error);
                Alert.alert("Error", error.response?.data?.error || error.message || "Failed to save profile");
                return; // Keep edit mode open on error
            }
        }
        setIsEditing(!isEditing);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {user?.role === 'GUNMAN' ? 'Gunman Profile' : 'Bouncer Profile'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Card */}
                <View style={[styles.card, styles.profileCard]}>
                    <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.avatarContainer}>
                        {image || user?.profilePhoto || user?.bouncerProfile?.profilePhoto ? (
                            <Image source={{ uri: image || user?.profilePhoto || user?.bouncerProfile?.profilePhoto }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.avatarText}>
                                    {name ? name.charAt(0).toUpperCase() : 'B'}
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
                            placeholder="Full Name"
                            placeholderTextColor="#666"
                        />
                    ) : (
                        <Text style={styles.userName}>{name}</Text>
                    )}

                    <Text style={styles.userEmail}>{user?.email}</Text>

                    {/* Verification Badge */}
                    <View style={styles.verificationBadge}>
                        <MaterialCommunityIcons
                            name={user?.bouncerProfile?.verificationStatus === 'APPROVED' ? "check-decagram" : "clock-alert-outline"}
                            size={16}
                            color={user?.bouncerProfile?.verificationStatus === 'APPROVED' ? "#000" : "#fff"}
                        />
                        <Text style={[
                            styles.verificationText,
                            { color: user?.bouncerProfile?.verificationStatus === 'APPROVED' ? '#000' : '#fff' }
                        ]}>
                            {user?.bouncerProfile?.verificationStatus === 'APPROVED' ? 'Verified Security' : 'Verification Pending'}
                        </Text>
                    </View>

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
                            <Text style={styles.contactText}>{contact || 'No Contact Info'}</Text>
                        )}
                    </View>

                    {/* Stats / Details Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Age</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Age"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.statValue}>{age || '-'}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Gender</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={gender}
                                    onChangeText={setGender}
                                    placeholder="Gender"
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.statValue}>{gender || '-'}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Rating</Text>
                            <Text style={styles.statValue}>{user?.bouncerProfile?.rating?.toFixed(1) || '0.0'} ⭐</Text>
                        </View>
                    </View>

                    {/* Registration Info */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionLabel}>Registration Details</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Type:</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, { textAlign: 'left' }]}
                                    value={registrationType}
                                    onChangeText={setRegistrationType}
                                    placeholder="Individual/Agency"
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.infoValue}>{registrationType || '-'}</Text>
                            )}
                        </View>
                        {(registrationType === 'Agency' || agencyCode) && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Agency Code:</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.input, { textAlign: 'left' }]}
                                        value={agencyCode}
                                        onChangeText={setAgencyCode}
                                        placeholder="Code"
                                        placeholderTextColor="#666"
                                    />
                                ) : (
                                    <Text style={styles.infoValue}>{agencyCode || '-'}</Text>
                                )}
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.saveBtn]}
                        onPress={() => navigation.navigate('BouncerSurvey')}
                    >
                        <Text style={[styles.btnText, styles.saveBtnText]}>
                            Complete / Edit Profile Survey
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Gun License - Only for Gunman or if has license */}
                {(user?.role === 'GUNMAN' || user?.bouncerProfile?.hasGunLicense) && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="pistol" size={20} color="#FFD700" />
                            <Text style={styles.cardTitle}>Gun License Details</Text>
                        </View>

                        <View style={styles.licenseContainer}>
                            <Text style={styles.licenseStatus}>Status: {user?.bouncerProfile?.hasGunLicense ? 'Licensed' : 'No License'}</Text>
                            {user?.bouncerProfile?.gunLicensePhoto && (
                                <Image
                                    source={{ uri: user.bouncerProfile.gunLicensePhoto }}
                                    style={styles.licenseImage}
                                    resizeMode="cover"
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* Settings Menu */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="card-outline" size={22} color="#ccc" />
                            <Text style={styles.menuText}>Payment Settings</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLocationPermissionPress}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="location-outline" size={22} color="#ccc" />
                            <Text style={styles.menuText}>Location Permission</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{
                                color: locationPermissionStatus === 'Granted' ? '#4CD964' : '#FF3B30',
                                marginRight: 8,
                                fontSize: 12
                            }}>
                                {locationPermissionStatus}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#ccc" />
                            <Text style={styles.menuText}>Verification Status</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: user?.bouncerProfile?.verificationStatus === 'APPROVED' ? '#4CD964' : '#FF9500', marginRight: 8, fontSize: 12 }}>
                                {user?.bouncerProfile?.verificationStatus}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </View>
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
        backgroundColor: '#0F0F0F',
    },
    header: {
        height: 40,
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
        marginBottom: 12,
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
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 20,
    },
    verificationText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
        color: '#000',
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
        minWidth: 80,
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
        minWidth: 60,
        textAlign: 'center',
        fontSize: 16,
        color: '#fff',
        paddingVertical: 2,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#444',
        marginHorizontal: 15,
    },
    infoSection: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: '#252525',
        padding: 15,
        borderRadius: 12,
    },
    sectionLabel: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        paddingBottom: 5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#aaa',
    },
    infoValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
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
    // Gun License
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
    licenseContainer: {
        alignItems: 'center',
    },
    licenseStatus: {
        fontSize: 14,
        color: '#ddd',
        marginBottom: 10,
    },
    licenseImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#333',
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
