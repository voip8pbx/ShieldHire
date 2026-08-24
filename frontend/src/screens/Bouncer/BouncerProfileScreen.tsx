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
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingTooltip from '../../components/OnboardingTooltip';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

let hasShownProfileTooltipThisSession = false;

export default function BouncerProfileScreen() {
    const { user, logout, updateUser } = useContext(AuthContext);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();


    // State
    const [image, setImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // User Basic Info
    const [name, setName] = useState(user?.name || '');
    const [contact, setContact] = useState(user?.contactNo || '');

    // Bouncer Specific Info
    const [age, setAge] = useState<string>(user?.bouncerProfile?.age?.toString() || '');
    const [gender, setGender] = useState(user?.bouncerProfile?.gender || '');
    const [experience, setExperience] = useState<string>(user?.bouncerProfile?.experience?.toString() || '5');
    const [registrationType, setRegistrationType] = useState(user?.bouncerProfile?.registrationType || '');
    const [agencyCode, setAgencyCode] = useState(user?.bouncerProfile?.agencyReferralCode || '');
    const [upiId, setUpiId] = useState(user?.bouncerProfile?.upiId || '');
    const [locationPermissionStatus, setLocationPermissionStatus] = useState<'Granted' | 'Denied' | 'Not Determined'>('Not Determined');


    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [targetPos, setTargetPos] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const surveyBtnRef = React.useRef<any>(null);

    const checkOnboarding = async () => {
        try {
            const isApproved = user?.bouncerProfile?.verificationStatus === 'APPROVED';
            const isProfileComplete = !!user?.bouncerProfile?.bio && (user?.bouncerProfile?.skills?.length || 0) > 0;

            if (isApproved && !isProfileComplete && !hasShownProfileTooltipThisSession) {
                hasShownProfileTooltipThisSession = true;
                setTimeout(() => {
                    surveyBtnRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
                        if (y > 0) {
                            setTargetPos({ left: x, top: y, width, height });
                            setShowOnboarding(true);
                        } else {
                            // Fallback if measurement fails or is off-screen
                            setTargetPos({ left: 20, top: Dimensions.get('window').height - 200, width: Dimensions.get('window').width - 40, height: 50 });
                            setShowOnboarding(true);
                        }
                    });
                }, 1000);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const handleOnboardingSkip = async () => {
        setShowOnboarding(false);
    };

    const handleOnboardingNext = async () => {
        setShowOnboarding(false);
        navigation.navigate('BouncerSurvey');
    };

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
                    setUpiId(userData.bouncerProfile.upiId || '');
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    useEffect(() => {
        fetchProfile();
        checkLocationPermission();
        checkOnboarding();
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
                        message: "SOS Guard needs access to your location for verification and SOS features.",
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
                setUpiId(user.bouncerProfile.upiId || '');
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
                        experience,
                        registrationType,
                        agencyReferralCode: agencyCode,
                        upiId,
                    }

                });

                if (response.data && response.data.user) {
                    updateUser(response.data.user);
                    Alert.alert("Profile Saved", "Your details have been updated.");
                }
            } catch (error: any) {
                console.error("Save profile error", error);
                const errorMsg = error.response?.data?.error || error.message;
                if (errorMsg === 'Invalid token.') {
                    Alert.alert("Session Expired", "Your session has expired. Please log in again.", [
                        { text: "Log Out", onPress: () => logout() }
                    ]);
                } else {
                    Alert.alert("Error", errorMsg || "Failed to save profile");
                }
                return; // Keep edit mode open on error
            }
        }
        setIsEditing(!isEditing);
    };

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
                            {user?.role === 'GUNMAN' ? 'Gunman Profile' : 'Security Profile'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.editHeaderBtn, isEditing && styles.saveHeaderBtn]}
                        onPress={toggleEdit}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={isEditing ? "checkmark" : "create-outline"}
                            size={18}
                            color={isEditing ? "#000" : "#FFD700"}
                        />
                        <Text style={[styles.editHeaderBtnText, isEditing && { color: '#000' }]}>
                            {isEditing ? "SAVE" : "EDIT"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>


                {/* Premium Profile Card */}
                <View style={styles.premiumProfileCard}>
                    <View style={styles.profileHeaderLayout}>
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
                                <Text style={styles.userName}>{name}</Text>
                            )}
                            <Text style={styles.userEmail}>{user?.email}</Text>

                            {/* Verification Badge */}
                            <View style={[
                                styles.verificationBadge,
                                user?.bouncerProfile?.verificationStatus === 'APPROVED' && styles.verificationApprovedBadge,
                                user?.bouncerProfile?.verificationStatus === 'REJECTED' && styles.verificationRejectedBadge,
                            ]}>
                                <MaterialCommunityIcons
                                    name={
                                        user?.bouncerProfile?.verificationStatus === 'APPROVED' ? "check-decagram" :
                                        user?.bouncerProfile?.verificationStatus === 'REJECTED' ? "close-octagon" : "clock-alert-outline"
                                    }
                                    size={14}
                                    color={user?.bouncerProfile?.verificationStatus === 'APPROVED' ? "#000" : "#fff"}
                                />
                                <Text style={[
                                    styles.verificationText,
                                    { color: user?.bouncerProfile?.verificationStatus === 'APPROVED' ? '#000' : '#fff' }
                                ]}>
                                    {
                                        user?.bouncerProfile?.verificationStatus === 'APPROVED' ? 'Verified Security' :
                                        user?.bouncerProfile?.verificationStatus === 'REJECTED' ? 'Verification Rejected' : 'Verification Pending'
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Rejected Reason */}
                    {user?.bouncerProfile?.verificationStatus === 'REJECTED' && (
                        <View style={styles.rejectedReasonBox}>
                            <Text style={styles.rejectedReasonLabel}>Rejection Reason:</Text>
                            <Text style={styles.rejectedReasonText}>
                                {user?.bouncerProfile?.rejectionReason || 'Please verify your details and documents.'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Contact Number */}
                    <View style={styles.statsRow}>
                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Contact Number</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={contact}
                                    onChangeText={setContact}
                                    placeholder="Contact Number"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                />
                            ) : (
                                <Text style={styles.statValue}>{contact || 'No Contact Info'}</Text>
                            )}
                        </View>
                    </View>

                    {/* Stats / Details Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Experience</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={experience}
                                    onChangeText={setExperience}
                                    placeholder="Yrs"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.statValue}>{experience ? `${experience} Yrs` : '5 Yrs'}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Age / Gender</Text>
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
                                <Text style={styles.statValue}>{age ? `${age}y` : '28y'} • {gender || 'Male'}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>Real Rating</Text>
                            <Text style={styles.statValue}>{user?.bouncerProfile?.rating ? user.bouncerProfile.rating.toFixed(1) : '4.8'} ⭐</Text>
                        </View>
                    </View>


                    {/* UPI ID */}
                    <View style={styles.statsRow}>
                        <View style={styles.statInputGroup}>
                            <Text style={styles.label}>UPI ID (for payments)</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={upiId}
                                    onChangeText={setUpiId}
                                    placeholder="e.g. name@upi"
                                    placeholderTextColor="#666"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            ) : (
                                <Text style={[styles.statValue, !upiId && { color: '#FF9500' }]}>
                                    {upiId || 'Not configured'}
                                </Text>
                            )}
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
                        ref={surveyBtnRef}
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

            <OnboardingTooltip
                visible={showOnboarding}
                title="Profile Survey"
                message="Tap here to complete the required survey. This helps verify your profile and improve matching."
                targetPosition={targetPos}
                highlightPosition={targetPos}
                arrowDirection="down"
                nextLabel="Complete Now"
                onNext={handleOnboardingNext}
                onSkip={handleOnboardingSkip}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 15,
        paddingBottom: 15,
        backgroundColor: '#0A0A0A',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    backBtnHeader: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    editHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    saveHeaderBtn: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    editHeaderBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFD700',
        marginLeft: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 140, // Safe padding for floating bottom tab bar
    },

    card: {
        backgroundColor: '#1A1A1E',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    premiumProfileCard: {
        backgroundColor: '#1A1A1E',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    profileHeaderLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileInfoLayout: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        backgroundColor: '#2A2A2E',
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#FFD700',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1A1A1E',
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    userEmail: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 8,
    },
    userNameInput: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        paddingVertical: 2,
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    verificationApprovedBadge: {
        backgroundColor: '#FFD700',
    },
    verificationRejectedBadge: {
        backgroundColor: '#FF3B30',
    },
    rejectedReasonBox: {
        backgroundColor: 'rgba(255, 59, 48, 0.05)',
        borderColor: 'rgba(255, 59, 48, 0.2)',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        width: '100%',
        marginBottom: 20,
    },
    rejectedReasonLabel: {
        color: '#FF3B30',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2,
    },
    rejectedReasonText: {
        color: '#E0E0E0',
        fontSize: 13,
        lineHeight: 16,
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
        color: '#E0E0E0',
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
        marginVertical: 12,
        width: '100%',
    },
    statInputGroup: {
        flex: 1,
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        fontSize: 16,
        color: '#fff',
        paddingVertical: 4,
        width: '100%',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        width: '100%',
        marginVertical: 8,
    },
    infoSection: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: '#121214',
        padding: 15,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    sectionLabel: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
        color: '#8E8E93',
    },
    infoValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    actionBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        marginTop: 16,
    },
    editBtn: {
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    saveBtn: {
        borderColor: '#FFD700',
        backgroundColor: '#FFD700',
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
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
        color: '#E0E0E0',
        marginBottom: 10,
    },
    licenseImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#121214',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    // Menu
    menuContainer: {
        backgroundColor: '#1A1A1E',
        borderRadius: 20,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 15,
        color: '#E0E0E0',
        marginLeft: 12,
        fontWeight: '500',
    },
});
