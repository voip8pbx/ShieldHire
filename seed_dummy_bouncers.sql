-- =============================================
-- Dummy Data: 5 Verified Bouncers for Testing
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Create corresponding dummy users first
INSERT INTO "users" ("id", "email", "name", "contactNo", "age", "role", "profilePhoto") 
VALUES
('b1000000-0000-0000-0000-000000000001', 'ramesh.bouncer@example.com', 'Ramesh Singh', '+919876543210', 28, 'BOUNCER', 'https://randomuser.me/api/portraits/men/32.jpg'),
('b2000000-0000-0000-0000-000000000002', 'suresh.bouncer@example.com', 'Suresh Kumar', '+919876543211', 32, 'BOUNCER', 'https://randomuser.me/api/portraits/men/44.jpg'),
('b3000000-0000-0000-0000-000000000003', 'vikram.bouncer@example.com', 'Vikram Yadav', '+919876543212', 30, 'BOUNCER', 'https://randomuser.me/api/portraits/men/55.jpg'),
('b4000000-0000-0000-0000-000000000004', 'amit.bouncer@example.com', 'Amit Sharma', '+919876543213', 29, 'BOUNCER', 'https://randomuser.me/api/portraits/men/66.jpg'),
('b5000000-0000-0000-0000-000000000005', 'deepak.bouncer@example.com', 'Deepak Verma', '+919876543214', 35, 'BOUNCER', 'https://randomuser.me/api/portraits/men/77.jpg')
ON CONFLICT ("id") DO NOTHING;

-- 2. Create the bouncer profiles
INSERT INTO "bouncers" (
    "id", 
    "userId", 
    "name", 
    "contactNo", 
    "age", 
    "gender", 
    "profilePhoto",
    "govtIdPhoto",
    "hasGunLicense",
    "gunLicensePhoto",
    "rating", 
    "isAvailable", 
    "bio", 
    "skills",
    "experience",
    "gallery",
    "verificationStatus", 
    "verifiedBy", 
    "verifiedAt"
) VALUES
(
    'bb100000-0000-0000-0000-000000000001', 
    'b1000000-0000-0000-0000-000000000001', 
    'Ramesh Singh', 
    '+919876543210', 
    28, 
    'Male', 
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://dummyimage.com/600x400/cccccc/000000&text=Govt+ID+Ramesh',
    true,
    'https://dummyimage.com/600x400/cccccc/000000&text=Gun+License+Ramesh',
    4.5, 
    true, 
    'Experienced event bouncer with a calm demeanor.', 
    ARRAY['Crowd Control', 'Event Security', 'First Aid'],
    5,
    ARRAY[
        'https://dummyimage.com/800x600/1a1a1a/ffffff&text=Event+1',
        'https://dummyimage.com/800x600/1a1a1a/ffffff&text=Event+2',
        'https://dummyimage.com/800x600/1a1a1a/ffffff&text=Event+3',
        'https://dummyimage.com/800x600/1a1a1a/ffffff&text=Event+4'
    ],
    'APPROVED', 
    'admin@example.com', 
    NOW()
),
(
    'bb200000-0000-0000-0000-000000000002', 
    'b2000000-0000-0000-0000-000000000002', 
    'Suresh Kumar', 
    '+919876543211', 
    32, 
    'Male', 
    'https://randomuser.me/api/portraits/men/44.jpg',
    'https://dummyimage.com/600x400/cccccc/000000&text=Govt+ID+Suresh',
    false,
    NULL,
    4.8, 
    true, 
    'Expert in club security and VIP protection.', 
    ARRAY['VIP Protection', 'Conflict Resolution'],
    8,
    ARRAY[
        'https://dummyimage.com/800x600/2b2b2b/ffffff&text=Club+Duty+1',
        'https://dummyimage.com/800x600/2b2b2b/ffffff&text=Club+Duty+2',
        'https://dummyimage.com/800x600/2b2b2b/ffffff&text=VIP+Escort',
        'https://dummyimage.com/800x600/2b2b2b/ffffff&text=Team+Briefing'
    ],
    'APPROVED', 
    'admin@example.com', 
    NOW()
),
(
    'bb300000-0000-0000-0000-000000000003', 
    'b3000000-0000-0000-0000-000000000003', 
    'Vikram Yadav', 
    '+919876543212', 
    30, 
    'Male', 
    'https://randomuser.me/api/portraits/men/55.jpg',
    'https://dummyimage.com/600x400/cccccc/000000&text=Govt+ID+Vikram',
    true,
    'https://dummyimage.com/600x400/cccccc/000000&text=Gun+License+Vikram',
    4.2, 
    true, 
    'Ex-military, highly disciplined security professional.', 
    ARRAY['Unarmed Combat', 'Surveillance'],
    6,
    ARRAY[
        'https://dummyimage.com/800x600/3c3c3c/ffffff&text=Training+Session',
        'https://dummyimage.com/800x600/3c3c3c/ffffff&text=Surveillance',
        'https://dummyimage.com/800x600/3c3c3c/ffffff&text=Security+Detail',
        'https://dummyimage.com/800x600/3c3c3c/ffffff&text=Patrol'
    ],
    'APPROVED', 
    'admin@example.com', 
    NOW()
),
(
    'bb400000-0000-0000-0000-000000000004', 
    'b4000000-0000-0000-0000-000000000004', 
    'Amit Sharma', 
    '+919876543213', 
    29, 
    'Male', 
    'https://randomuser.me/api/portraits/men/66.jpg',
    'https://dummyimage.com/600x400/cccccc/000000&text=Govt+ID+Amit',
    false,
    NULL,
    4.6, 
    true, 
    'Certified security professional specializing in private events.', 
    ARRAY['Access Control', 'Emergency Response'],
    4,
    ARRAY[
        'https://dummyimage.com/800x600/4d4d4d/ffffff&text=Private+Event',
        'https://dummyimage.com/800x600/4d4d4d/ffffff&text=Access+Control',
        'https://dummyimage.com/800x600/4d4d4d/ffffff&text=Crowd+Management',
        'https://dummyimage.com/800x600/4d4d4d/ffffff&text=Event+Security'
    ],
    'APPROVED', 
    'admin@example.com', 
    NOW()
),
(
    'bb500000-0000-0000-0000-000000000005', 
    'b5000000-0000-0000-0000-000000000005', 
    'Deepak Verma', 
    '+919876543214', 
    35, 
    'Male', 
    'https://randomuser.me/api/portraits/men/77.jpg',
    'https://dummyimage.com/600x400/cccccc/000000&text=Govt+ID+Deepak',
    true,
    'https://dummyimage.com/600x400/cccccc/000000&text=Gun+License+Deepak',
    4.9, 
    true, 
    'Heavy-duty security for high-risk environments.', 
    ARRAY['Risk Assessment', 'Physical Security'],
    10,
    ARRAY[
        'https://dummyimage.com/800x600/5e5e5e/ffffff&text=High+Risk+Operation',
        'https://dummyimage.com/800x600/5e5e5e/ffffff&text=Tactical+Gear',
        'https://dummyimage.com/800x600/5e5e5e/ffffff&text=Security+Assessment',
        'https://dummyimage.com/800x600/5e5e5e/ffffff&text=Convoy+Security'
    ],
    'APPROVED', 
    'admin@example.com', 
    NOW()
)
ON CONFLICT ("id") DO NOTHING;
