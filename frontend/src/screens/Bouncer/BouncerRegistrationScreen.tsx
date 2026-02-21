import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';

type BouncerRegistrationNavigationProp = StackNavigationProp<RootStackParamList, 'BouncerRegistration'>;
type BouncerRegistrationRouteProp = RouteProp<RootStackParamList, 'BouncerRegistration'>;

type Props = {
    navigation: BouncerRegistrationNavigationProp;
    route: BouncerRegistrationRouteProp;
};

export default function BouncerRegistrationScreen({ navigation, route }: Props) {
    const { name: initialName, email: initialEmail, photo: initialPhoto } = route.params || {};
    const { logout, updateUser } = React.useContext(AuthContext);

    const [email, setEmail] = useState(initialEmail || '');

    const [name, setName] = useState(initialName || '');
    const [contactNo, setContactNo] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(initialPhoto || null);
    const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
    const [govtIdPhoto, setGovtIdPhoto] = useState<string | null>(null);
    const [govtIdPhotoBase64, setGovtIdPhotoBase64] = useState<string | null>(null);
    const [hasGunLicense, setHasGunLicense] = useState(false);
    const [gunLicensePhoto, setGunLicensePhoto] = useState<string | null>(null);
    const [gunLicensePhotoBase64, setGunLicensePhotoBase64] = useState<string | null>(null);
    const [registrationType, setRegistrationType] = useState<'Individual' | 'Agency'>('Individual');
    const [agencyReferralCode, setAgencyReferralCode] = useState('');
    const [loading, setLoading] = useState(false);

    const pickImage = (setUri: (uri: string | null) => void, setBase64: (base64: string | null) => void) => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true,
                maxHeight: 1000,
                maxWidth: 1000,
                quality: 0.8,
            },
            (response) => {
                if (response.didCancel) {
                    return;
                }
                if (response.errorCode) {
                    Alert.alert('Error', response.errorMessage || 'Failed to pick image');
                    return;
                }
                if (response.assets && response.assets[0].uri && response.assets[0].base64) {
                    setUri(response.assets[0].uri);
                    setBase64(`data:${response.assets[0].type};base64,${response.assets[0].base64}`);
                }
            }
        );
    };

    const handleSubmit = async () => {
        // Validation
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
        if (!contactNo.trim() || contactNo.length < 10) {
            Alert.alert('Error', 'Please enter a valid contact number');
            return;
        }
        if (!age || parseInt(age) < 18 || parseInt(age) > 65) {
            Alert.alert('Error', 'Age must be between 18 and 65');
            return;
        }
        if (!govtIdPhoto) {
            Alert.alert('Error', 'Please upload a valid Government Photo ID');
            return;
        }
        if (hasGunLicense && !gunLicensePhoto) {
            Alert.alert('Error', 'Please upload your Gun License');
            return;
        }
        if (registrationType === 'Agency' && !agencyReferralCode.trim()) {
            Alert.alert('Error', 'Please enter your Agency Referral Code');
            return;
        }

        setLoading(true);
        try {
            const role = hasGunLicense ? 'GUNMAN' : 'BOUNCER';
            const payload = {
                email,

                name,
                contactNo,
                age: parseInt(age),
                gender,
                profilePhoto: profilePhotoBase64 || profilePhoto,
                govtIdPhoto: govtIdPhotoBase64,
                hasGunLicense,
                gunLicensePhoto: gunLicensePhotoBase64,
                isGunman: hasGunLicense,
                registrationType,
                agencyReferralCode: registrationType === 'Agency' ? agencyReferralCode : undefined,
                role
            };

            const response = await api.post('/auth/bouncer/register', payload);

            // Update local user context so navigation updates correctly
            if (response.data && response.data.user) {
                updateUser(response.data.user);
            }

            // DO NOT explicitly navigate!
            // The AuthContext update above will trigger App.tsx to re-evaluate the stack 
            // and automatically unmount this screen and mount VerificationPending!

        } catch (error: any) {
            console.error('Registration error:', error);
            Alert.alert('Error', error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            logout();
                        }}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFD700" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bouncer Registration</Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Profile Photo */}
                    <View style={styles.photoSection}>
                        <Text style={styles.label}>Profile Photo (Optional)</Text>
                        <TouchableOpacity
                            style={styles.photoButton}
                            onPress={() => pickImage(setProfilePhoto, setProfilePhotoBase64)}
                        >
                            {profilePhoto ? (
                                <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <MaterialCommunityIcons name="camera-plus" size={40} color="#666" />
                                    <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Registration Type Toggle */}
                    <View style={styles.inputGroup}>
                        <View style={styles.licenseHeader}>
                            <MaterialCommunityIcons name="office-building" size={24} color="#FFD700" />
                            <Text style={styles.label}>Registration Type</Text>
                        </View>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    registrationType === 'Individual' && styles.toggleButtonActive,
                                ]}
                                onPress={() => {
                                    setRegistrationType('Individual');
                                    setAgencyReferralCode('');
                                }}
                            >
                                <MaterialCommunityIcons
                                    name="account"
                                    size={18}
                                    color={registrationType === 'Individual' ? '#000' : '#888'}
                                />
                                <Text
                                    style={[
                                        styles.toggleButtonText,
                                        registrationType === 'Individual' && styles.toggleButtonTextActive,
                                    ]}
                                >
                                    Individual
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    registrationType === 'Agency' && styles.toggleButtonActive,
                                ]}
                                onPress={() => setRegistrationType('Agency')}
                            >
                                <MaterialCommunityIcons
                                    name="office-building"
                                    size={18}
                                    color={registrationType === 'Agency' ? '#000' : '#888'}
                                />
                                <Text
                                    style={[
                                        styles.toggleButtonText,
                                        registrationType === 'Agency' && styles.toggleButtonTextActive,
                                    ]}
                                >
                                    Agency
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Agency Referral Code (Conditional) */}
                    {registrationType === 'Agency' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Agency Referral Code *</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="ticket-confirmation" size={20} color="#888" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter agency referral code"
                                    placeholderTextColor="#666"
                                    value={agencyReferralCode}
                                    onChangeText={setAgencyReferralCode}
                                    autoCapitalize="characters"
                                    maxLength={20}
                                />
                            </View>
                            <View style={styles.infoBox}>
                                <MaterialCommunityIcons name="information" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>
                                    Enter the referral code provided by your security agency
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address *</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email" size={20} color="#888" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#666"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>



                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="account" size={20} color="#888" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor="#666"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    {/* Contact Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contact Number *</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="phone" size={20} color="#888" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your contact number"
                                placeholderTextColor="#666"
                                value={contactNo}
                                onChangeText={setContactNo}
                                keyboardType="phone-pad"
                                maxLength={15}
                            />
                        </View>
                    </View>

                    {/* Age */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Age *</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="calendar" size={20} color="#888" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your age"
                                placeholderTextColor="#666"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                                maxLength={2}
                            />
                        </View>
                    </View>

                    {/* Gender */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender *</Text>
                        <View style={styles.genderContainer}>
                            {(['Male', 'Female', 'Other'] as const).map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genderButton,
                                        gender === g && styles.genderButtonActive,
                                    ]}
                                    onPress={() => setGender(g)}
                                >
                                    <Text
                                        style={[
                                            styles.genderButtonText,
                                            gender === g && styles.genderButtonTextActive,
                                        ]}
                                    >
                                        {g}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Government ID */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Government Photo ID *</Text>
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={() => pickImage(setGovtIdPhoto, setGovtIdPhotoBase64)}
                        >
                            {govtIdPhoto ? (
                                <View style={styles.uploadedContainer}>
                                    <Image source={{ uri: govtIdPhoto }} style={styles.uploadedImage} />
                                    <View style={styles.uploadedOverlay}>
                                        <MaterialCommunityIcons name="check-circle" size={30} color="#4CAF50" />
                                        <Text style={styles.uploadedText}>ID Uploaded</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <MaterialCommunityIcons name="file-upload" size={30} color="#FFD700" />
                                    <Text style={styles.uploadText}>Upload Government ID</Text>
                                    <Text style={styles.uploadSubtext}>Aadhar, PAN, Driving License, etc.</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Gun License Toggle */}
                    <View style={styles.inputGroup}>
                        <View style={styles.licenseHeader}>
                            <MaterialCommunityIcons name="pistol" size={24} color="#FFD700" />
                            <Text style={styles.label}>Do you have a Gun License?</Text>
                        </View>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    !hasGunLicense && styles.toggleButtonActive,
                                ]}
                                onPress={() => {
                                    setHasGunLicense(false);
                                    setGunLicensePhoto(null);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.toggleButtonText,
                                        !hasGunLicense && styles.toggleButtonTextActive,
                                    ]}
                                >
                                    No
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    hasGunLicense && styles.toggleButtonActive,
                                ]}
                                onPress={() => setHasGunLicense(true)}
                            >
                                <Text
                                    style={[
                                        styles.toggleButtonText,
                                        hasGunLicense && styles.toggleButtonTextActive,
                                    ]}
                                >
                                    Yes
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Gun License Upload (Conditional) */}
                    {hasGunLicense && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gun License Photo *</Text>
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => pickImage(setGunLicensePhoto, setGunLicensePhotoBase64)}
                            >
                                {gunLicensePhoto ? (
                                    <View style={styles.uploadedContainer}>
                                        <Image source={{ uri: gunLicensePhoto }} style={styles.uploadedImage} />
                                        <View style={styles.uploadedOverlay}>
                                            <MaterialCommunityIcons name="check-circle" size={30} color="#4CAF50" />
                                            <Text style={styles.uploadedText}>License Uploaded</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <MaterialCommunityIcons name="file-upload" size={30} color="#FFD700" />
                                        <Text style={styles.uploadText}>Upload Gun License</Text>
                                        <Text style={styles.uploadSubtext}>Clear photo of your gun license</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <View style={styles.infoBox}>
                                <MaterialCommunityIcons name="information" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>
                                    You will be registered as a <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>GUNMAN</Text>
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>COMPLETE REGISTRATION</Text>
                                <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    photoButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1E1E1E',
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 10,
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        height: 55,
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        marginLeft: 10,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        height: 50,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#333',
    },
    genderButtonActive: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    genderButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    genderButtonTextActive: {
        color: '#000',
    },
    uploadButton: {
        height: 150,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    uploadSubtext: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
    },
    uploadedContainer: {
        flex: 1,
        position: 'relative',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    uploadedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadedText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 5,
    },
    licenseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    toggleButton: {
        flex: 1,
        height: 50,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#333',
    },
    toggleButtonActive: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    toggleButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    toggleButtonTextActive: {
        color: '#000',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    infoText: {
        color: '#ccc',
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#FFD700',
        height: 60,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    submitButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
        marginRight: 10,
    },
});
