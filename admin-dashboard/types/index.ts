// Bouncer Types
export interface Bouncer {
    id: string;
    name: string;
    email: string;
    phone: string;
    experience: number; // years
    rating: number;
    specialization: string[];
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
    verificationStatus: 'pending' | 'verified' | 'rejected';
    location: Location;
    documents: Document[];
    profileImage: string;
    createdAt: string;
    updatedAt: string;
    totalBookings: number;
    activeBookings: number;
}

// User Types
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    profileImage: string;
    joinedDate: string;
    totalBookings: number;
    activeBookings: number;
    status: 'active' | 'inactive' | 'suspended';
}

// Location Types
export interface Location {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
}

// Document Types
export interface Document {
    id: string;
    type: 'aadhar' | 'pan' | 'license' | 'certificate';
    url: string;
    verified: boolean;
    uploadedAt: string;
}

// Booking/Engagement Types
export interface Engagement {
    id: string;
    user: User;
    bouncer: Bouncer;
    startDate: string;
    endDate: string;
    duration: number; // hours
    location: Location;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    totalAmount: number;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    createdAt: string;
    updatedAt: string;
}

// Verification Request Types
export interface VerificationRequest {
    id: string;
    bouncer: Bouncer;
    requestedAt: string;
    documents: Document[];
    notes: string;
    adminNotes?: string;
    status: 'pending' | 'approved' | 'rejected';
}

// Dashboard Stats Types
export interface DashboardStats {
    totalBouncers: number;
    activeBouncers: number;
    pendingVerifications: number;
    totalUsers: number;
    activeEngagements: number;
    totalRevenue: number;
    revenueGrowth: number;
    newBouncersThisMonth: number;
    newUsersThisMonth: number;
}

// Activity Log Types
export interface ActivityLog {
    id: string;
    type: 'verification' | 'booking' | 'user_action' | 'bouncer_action';
    message: string;
    timestamp: string;
    user?: User;
    bouncer?: Bouncer;
}
