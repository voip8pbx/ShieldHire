import { Bouncer, User, Engagement, VerificationRequest, DashboardStats, ActivityLog } from '../types';

export const mockBouncers: Bouncer[] = [
    {
        id: '1',
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        phone: '+91 98765 43210',
        experience: 8,
        rating: 4.8,
        specialization: ['Event Security', 'VIP Protection', 'Crowd Control'],
        status: 'active',
        verificationStatus: 'verified',
        location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: '123 Security Lane',
            city: 'New Delhi',
            state: 'Delhi',
            zipCode: '110001'
        },
        documents: [
            { id: '1', type: 'aadhar', url: '/docs/aadhar1.pdf', verified: true, uploadedAt: '2024-01-15' },
            { id: '2', type: 'license', url: '/docs/license1.pdf', verified: true, uploadedAt: '2024-01-15' }
        ],
        profileImage: 'https://i.pravatar.cc/150?img=12',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-02-10T14:20:00Z',
        totalBookings: 45,
        activeBookings: 2
    },
    {
        id: '2',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91 98765 43211',
        experience: 5,
        rating: 4.6,
        specialization: ['Corporate Security', 'Event Security'],
        status: 'active',
        verificationStatus: 'verified',
        location: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: '456 Guard Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001'
        },
        documents: [
            { id: '3', type: 'aadhar', url: '/docs/aadhar2.pdf', verified: true, uploadedAt: '2024-01-20' },
            { id: '4', type: 'certificate', url: '/docs/cert2.pdf', verified: true, uploadedAt: '2024-01-20' }
        ],
        profileImage: 'https://i.pravatar.cc/150?img=33',
        createdAt: '2024-01-20T09:15:00Z',
        updatedAt: '2024-02-09T11:30:00Z',
        totalBookings: 32,
        activeBookings: 1
    },
    {
        id: '3',
        name: 'Amit Sharma',
        email: 'amit.sharma@example.com',
        phone: '+91 98765 43212',
        experience: 3,
        rating: 4.3,
        specialization: ['Night Club Security', 'Crowd Control'],
        status: 'inactive',
        verificationStatus: 'verified',
        location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: '789 Defense Road',
            city: 'Bangalore',
            state: 'Karnataka',
            zipCode: '560001'
        },
        documents: [
            { id: '5', type: 'aadhar', url: '/docs/aadhar3.pdf', verified: true, uploadedAt: '2024-02-01' }
        ],
        profileImage: 'https://i.pravatar.cc/150?img=56',
        createdAt: '2024-02-01T13:45:00Z',
        updatedAt: '2024-02-08T16:10:00Z',
        totalBookings: 18,
        activeBookings: 0
    },
    {
        id: '4',
        name: 'Suresh Patel',
        email: 'suresh.patel@example.com',
        phone: '+91 98765 43213',
        experience: 10,
        rating: 4.9,
        specialization: ['VIP Protection', 'Armed Security', 'Event Security'],
        status: 'active',
        verificationStatus: 'verified',
        location: {
            latitude: 23.0225,
            longitude: 72.5714,
            address: '321 Protection Avenue',
            city: 'Ahmedabad',
            state: 'Gujarat',
            zipCode: '380001'
        },
        documents: [
            { id: '6', type: 'aadhar', url: '/docs/aadhar4.pdf', verified: true, uploadedAt: '2024-01-10' },
            { id: '7', type: 'license', url: '/docs/license4.pdf', verified: true, uploadedAt: '2024-01-10' },
            { id: '8', type: 'certificate', url: '/docs/cert4.pdf', verified: true, uploadedAt: '2024-01-10' }
        ],
        profileImage: 'https://i.pravatar.cc/150?img=68',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-02-10T12:45:00Z',
        totalBookings: 67,
        activeBookings: 3
    }
];

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Priya Mehta',
        email: 'priya.mehta@example.com',
        phone: '+91 97654 32109',
        profileImage: 'https://i.pravatar.cc/150?img=5',
        joinedDate: '2024-01-05T10:00:00Z',
        totalBookings: 8,
        activeBookings: 1,
        status: 'active'
    },
    {
        id: '2',
        name: 'Arjun Verma',
        email: 'arjun.verma@example.com',
        phone: '+91 97654 32108',
        profileImage: 'https://i.pravatar.cc/150?img=13',
        joinedDate: '2024-01-12T14:30:00Z',
        totalBookings: 5,
        activeBookings: 0,
        status: 'active'
    },
    {
        id: '3',
        name: 'Sneha Kapoor',
        email: 'sneha.kapoor@example.com',
        phone: '+91 97654 32107',
        profileImage: 'https://i.pravatar.cc/150?img=20',
        joinedDate: '2024-01-18T09:15:00Z',
        totalBookings: 12,
        activeBookings: 2,
        status: 'active'
    },
    {
        id: '4',
        name: 'Rahul Gupta',
        email: 'rahul.gupta@example.com',
        phone: '+91 97654 32106',
        profileImage: 'https://i.pravatar.cc/150?img=51',
        joinedDate: '2024-02-01T11:20:00Z',
        totalBookings: 3,
        activeBookings: 1,
        status: 'active'
    }
];

export const mockEngagements: Engagement[] = [
    {
        id: '1',
        user: mockUsers[0],
        bouncer: mockBouncers[0],
        startDate: '2024-02-15T18:00:00Z',
        endDate: '2024-02-16T02:00:00Z',
        duration: 8,
        location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Grand Hotel, Connaught Place',
            city: 'New Delhi',
            state: 'Delhi',
            zipCode: '110001'
        },
        status: 'active',
        totalAmount: 8000,
        paymentStatus: 'paid',
        createdAt: '2024-02-10T10:00:00Z',
        updatedAt: '2024-02-15T18:00:00Z'
    },
    {
        id: '2',
        user: mockUsers[2],
        bouncer: mockBouncers[1],
        startDate: '2024-02-16T20:00:00Z',
        endDate: '2024-02-17T04:00:00Z',
        duration: 8,
        location: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: 'Corporate Tower, BKC',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400051'
        },
        status: 'active',
        totalAmount: 7500,
        paymentStatus: 'paid',
        createdAt: '2024-02-11T14:30:00Z',
        updatedAt: '2024-02-16T20:00:00Z'
    },
    {
        id: '3',
        user: mockUsers[3],
        bouncer: mockBouncers[3],
        startDate: '2024-02-14T10:00:00Z',
        endDate: '2024-02-14T18:00:00Z',
        duration: 8,
        location: {
            latitude: 23.0225,
            longitude: 72.5714,
            address: 'Wedding Venue, SG Highway',
            city: 'Ahmedabad',
            state: 'Gujarat',
            zipCode: '380015'
        },
        status: 'completed',
        totalAmount: 9000,
        paymentStatus: 'paid',
        createdAt: '2024-02-08T09:00:00Z',
        updatedAt: '2024-02-14T18:30:00Z'
    },
    {
        id: '4',
        user: mockUsers[1],
        bouncer: mockBouncers[0],
        startDate: '2024-02-20T19:00:00Z',
        endDate: '2024-02-21T03:00:00Z',
        duration: 8,
        location: {
            latitude: 28.5355,
            longitude: 77.3910,
            address: 'Party Hall, Noida Sector 18',
            city: 'Noida',
            state: 'Uttar Pradesh',
            zipCode: '201301'
        },
        status: 'pending',
        totalAmount: 8500,
        paymentStatus: 'pending',
        createdAt: '2024-02-12T16:20:00Z',
        updatedAt: '2024-02-12T16:20:00Z'
    }
];

export const mockVerificationRequests: VerificationRequest[] = [
    {
        id: '1',
        bouncer: {
            id: '5',
            name: 'Karan Malhotra',
            email: 'karan.malhotra@example.com',
            phone: '+91 98765 43214',
            experience: 6,
            rating: 0,
            specialization: ['Event Security', 'Corporate Security'],
            status: 'pending',
            verificationStatus: 'pending',
            location: {
                latitude: 28.7041,
                longitude: 77.1025,
                address: '555 New Area',
                city: 'Delhi',
                state: 'Delhi',
                zipCode: '110034'
            },
            documents: [
                { id: '9', type: 'aadhar', url: '/docs/aadhar5.pdf', verified: false, uploadedAt: '2024-02-12' },
                { id: '10', type: 'license', url: '/docs/license5.pdf', verified: false, uploadedAt: '2024-02-12' }
            ],
            profileImage: 'https://i.pravatar.cc/150?img=70',
            createdAt: '2024-02-12T10:00:00Z',
            updatedAt: '2024-02-12T10:00:00Z',
            totalBookings: 0,
            activeBookings: 0
        },
        requestedAt: '2024-02-12T10:30:00Z',
        documents: [
            { id: '9', type: 'aadhar', url: '/docs/aadhar5.pdf', verified: false, uploadedAt: '2024-02-12' },
            { id: '10', type: 'license', url: '/docs/license5.pdf', verified: false, uploadedAt: '2024-02-12' }
        ],
        notes: 'Experienced security professional with 6 years in the industry.',
        status: 'pending'
    },
    {
        id: '2',
        bouncer: {
            id: '6',
            name: 'Deepak Rao',
            email: 'deepak.rao@example.com',
            phone: '+91 98765 43215',
            experience: 4,
            rating: 0,
            specialization: ['Night Club Security', 'Crowd Control'],
            status: 'pending',
            verificationStatus: 'pending',
            location: {
                latitude: 12.9716,
                longitude: 77.5946,
                address: '777 Tech Park',
                city: 'Bangalore',
                state: 'Karnataka',
                zipCode: '560095'
            },
            documents: [
                { id: '11', type: 'aadhar', url: '/docs/aadhar6.pdf', verified: false, uploadedAt: '2024-02-13' }
            ],
            profileImage: 'https://i.pravatar.cc/150?img=65',
            createdAt: '2024-02-13T11:00:00Z',
            updatedAt: '2024-02-13T11:00:00Z',
            totalBookings: 0,
            activeBookings: 0
        },
        requestedAt: '2024-02-13T11:30:00Z',
        documents: [
            { id: '11', type: 'aadhar', url: '/docs/aadhar6.pdf', verified: false, uploadedAt: '2024-02-13' }
        ],
        notes: 'Specialized in nightclub security and crowd management.',
        status: 'pending'
    }
];

export const mockDashboardStats: DashboardStats = {
    totalBouncers: 45,
    activeBouncers: 32,
    pendingVerifications: 2,
    totalUsers: 156,
    activeEngagements: 8,
    totalRevenue: 485000,
    revenueGrowth: 12.5,
    newBouncersThisMonth: 7,
    newUsersThisMonth: 24
};

export const mockActivityLogs: ActivityLog[] = [
    {
        id: '1',
        type: 'verification',
        message: 'New bouncer verification request received',
        timestamp: '2024-02-13T11:30:00Z',
        bouncer: mockVerificationRequests[1].bouncer
    },
    {
        id: '2',
        type: 'booking',
        message: 'New engagement booked',
        timestamp: '2024-02-12T16:20:00Z',
        user: mockUsers[1],
        bouncer: mockBouncers[0]
    },
    {
        id: '3',
        type: 'verification',
        message: 'New bouncer verification request received',
        timestamp: '2024-02-12T10:30:00Z',
        bouncer: mockVerificationRequests[0].bouncer
    },
    {
        id: '4',
        type: 'booking',
        message: 'Engagement completed successfully',
        timestamp: '2024-02-14T18:30:00Z',
        user: mockUsers[3],
        bouncer: mockBouncers[3]
    },
    {
        id: '5',
        type: 'booking',
        message: 'New engagement booked',
        timestamp: '2024-02-11T14:30:00Z',
        user: mockUsers[2],
        bouncer: mockBouncers[1]
    }
];
