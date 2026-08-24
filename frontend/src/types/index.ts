export type User = {
    id: string;
    email: string;
    name: string;
    contactNo?: string;
    profilePhoto?: string;
    role: 'USER' | 'ADMIN' | 'BOUNCER' | 'GUNMAN';
    bouncerProfile?: Bouncer;
    clientProfile?: ClientProfile;
};

export type ClientProfile = {
    id: string;
    userId: string;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
};

export type Bouncer = {
    id: string;
    userId: string;
    name: string;
    contactNo: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    profilePhoto?: string;
    govtIdPhoto: string;
    hasGunLicense: boolean;
    gunLicensePhoto?: string;
    isGunman: boolean;
    registrationType: 'Individual' | 'Agency';
    agencyReferralCode?: string;
    rating: number;
    isAvailable: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    bio?: string;
    upiId?: string;
    skills?: string[];
    experience?: number;
    gallery?: string[];
    identityVerified?: boolean;
    aadhaarLast4?: string;
    livenessVerifiedAt?: string;
    user?: {
        name?: string;
        email?: string;
        profilePhoto?: string;
    };
};



export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    VerificationPending: { userId: string };
    BouncerRegistration: { name?: string; email?: string; photo?: string };
};

export type RootStackParamList = {
    Auth: undefined;
    BouncerMain: undefined;
    ClientMain: undefined;
    BouncerSurvey: undefined;
    BouncerRegistration: { name?: string; email?: string; photo?: string };
    VerificationPending: undefined;
    ClientVerificationPending: undefined;
    ClientProfileSetup: undefined;
    BouncerBookingDetail: { bookingId: string };
    BookingDetails: { bookingId: string };
    Notifications: undefined;
    Chat: { bookingId: string };
};

export type MainTabParamList = {
    HomeStack: undefined;
    Bookings: undefined;
    Profile: undefined;
};

export type HomeStackParamList = {
    BouncerList: undefined;
    ExploreProfessionals: undefined;
    BouncerDetail: { bouncerId: string };
    ContactUs: undefined;

    BookingFlow: { bouncerId: string; price: number; package: 'SINGLE_SHIFT' | 'VIP_BODYGUARD'; selectedCoordinate?: { latitude: number; longitude: number } };
    PaymentScreen: {
        bouncerId: string;
        date: string;
        time: string;
        location: string;
        latitude: number | null;
        longitude: number | null;
        duration: number;
        totalPrice: number;
        package: 'SINGLE_SHIFT' | 'VIP_BODYGUARD';
        notes: string | null;
        bookingId?: string;
    };
    MapScreen: {
        initialLatitude?: number;
        initialLongitude?: number;
        bouncerId?: string;
        price?: number;
        package?: 'SINGLE_SHIFT' | 'VIP_BODYGUARD';
        mode?: 'pin' | 'explore';
    };
};

export type BouncerTabParamList = {
    BouncerHome: undefined;
    History: undefined;
    Profile: undefined;
};
