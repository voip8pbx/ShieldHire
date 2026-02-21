export type User = {
    id: string;
    email: string;
    name: string;
    contactNo?: string;
    profilePhoto?: string;
    role: 'USER' | 'ADMIN' | 'BOUNCER' | 'GUNMAN';
    bouncerProfile?: Bouncer;
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
    bio?: string;
    skills?: string[];
    experience?: number;
    gallery?: string[];
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
    VerificationPending: { userId: string };
};

export type MainTabParamList = {
    HomeStack: undefined;
    Bookings: undefined;
    Profile: undefined;
};

export type HomeStackParamList = {
    BouncerList: undefined;
    BouncerDetail: { bouncerId: string };
    BookingFlow: { bouncerId: string; price: number };
};

export type BouncerTabParamList = {
    BouncerHome: undefined;
    History: undefined;
    Profile: undefined;
};
