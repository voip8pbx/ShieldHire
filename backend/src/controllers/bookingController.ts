import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getIO } from '../socket';
import { sendPushToToken } from '../utils/fcmAdmin';

// Metadata Helpers to parse and format manual UPI payment details inside the 'notes' column
const parseNotesMetadata = (notesStr: string | null) => {
    const defaultVal = { userNotes: notesStr || '', transactionId: '', paymentStatus: 'PENDING', paymentProofUrl: '', chat: [] as any[] };
    if (!notesStr) return defaultVal;
    
    const parts = notesStr.split(' | ');
    let userNotes = '';
    let transactionId = '';
    let paymentStatus = 'PENDING';
    let paymentProofUrl = '';
    let chat = [] as any[];
    
    parts.forEach(part => {
        if (part.startsWith('Txn ID: ')) {
            transactionId = part.replace('Txn ID: ', '');
        } else if (part.startsWith('Payment Status: ')) {
            paymentStatus = part.replace('Payment Status: ', '');
        } else if (part.startsWith('Proof: ')) {
            paymentProofUrl = part.replace('Proof: ', '');
        } else if (part.startsWith('Chat: ')) {
            try {
                const chatJson = part.replace('Chat: ', '');
                chat = JSON.parse(chatJson);
            } catch (e) {
                console.error("Failed to parse chat json metadata:", e);
            }
        } else {
            userNotes = userNotes ? userNotes + ' | ' + part : part;
        }
    });
    
    return { userNotes, transactionId, paymentStatus, paymentProofUrl, chat };
};

const formatNotesMetadata = (userNotes: string, transactionId: string, paymentStatus: string, paymentProofUrl: string = '', chat: any[] = []) => {
    const parts = [];
    if (userNotes) parts.push(userNotes);
    if (transactionId) parts.push(`Txn ID: ${transactionId}`);
    if (paymentProofUrl) parts.push(`Proof: ${paymentProofUrl}`);
    parts.push(`Payment Status: ${paymentStatus}`);
    if (chat && chat.length > 0) {
        parts.push(`Chat: ${JSON.stringify(chat)}`);
    }
    return parts.join(' | ');
};

// Helper to parse location strings containing bundled coordinates
const parseLocation = (obj: any): any => {
    if (!obj || !obj.location) return obj;
    // Check if the location string has our secret COORDS delimiter
    const parts = obj.location.split('|COORDS:');
    if (parts.length > 1) {
        obj.location = parts[0];
        const coords = parts[1].split(',');
        obj.latitude = parseFloat(coords[0]);
        obj.longitude = parseFloat(coords[1]);
    } else {
        // If not, ensure latitude and longitude are null so frontend doesn't break
        obj.latitude = null;
        obj.longitude = null;
    }
    return obj;
};

const parseBioMetadata = (bioStr: string | null) => {
    const defaultVal = { bio: bioStr || '', upiId: '' };
    if (!bioStr) return defaultVal;
    
    const parts = bioStr.split(' | UPI ID: ');
    if (parts.length > 1) {
        return { bio: parts[0], upiId: parts[1] };
    }
    return defaultVal;
};

// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj: any): any => {
    if (!obj) return null;
    // First, decode the coordinates if they were bundled in the location string
    const parsedObj = parseLocation({ ...obj });
    const newObj: any = {};
    for (const key in parsedObj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = parsedObj[key];
    }
    
    // Inject parsed notes metadata directly so client/dashboard can read them as separate fields
    if (newObj.notes !== undefined) {
        const { userNotes, transactionId, paymentStatus, paymentProofUrl, chat } = parseNotesMetadata(newObj.notes);
        newObj.userNotes = userNotes;
        newObj.transactionId = transactionId;
        newObj.paymentStatus = paymentStatus;
        newObj.paymentProofUrl = paymentProofUrl;
        newObj.chat = chat;
    }

    // Inject parsed bouncer bio/upiId directly
    if (newObj.bio !== undefined) {
        const { bio, upiId } = parseBioMetadata(newObj.bio);
        newObj.bio = bio;
        newObj.upiId = upiId;
    }

    return newObj;
};

export const createBooking = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const clientName: string = (req as any).user.name || 'A client';
        const { bouncerId, date, time, location, latitude, longitude, duration, totalPrice, package: pkg, notes } = req.body;

        // Verify client profile existence and APPROVED status
        const { data: client, error: clientErr } = await supabaseAdmin
            .from('clients')
            .select('verificationStatus')
            .eq('userId', userId)
            .single();

        if (clientErr || !client) {
            return res.status(403).json({ error: 'Client profile not found. You must complete profile onboarding first.' });
        }

        if (client.verificationStatus !== 'APPROVED') {
            return res.status(403).json({ error: `Access denied. Your client profile is ${client.verificationStatus.toLowerCase()}. Only approved clients can book security detail.` });
        }

        // Fetch bouncer profile to verify existence, availability, and pricing details
        const { data: bouncer, error: bouncerErr } = await supabaseAdmin
            .from('bouncers')
            .select('userId, isAvailable, isGunman, name')
            .eq('id', bouncerId)
            .single();
        if (bouncerErr || !bouncer) {
            return res.status(404).json({ error: 'Bouncer not found' });
        }

        if (!bouncer.isAvailable) {
            return res.status(400).json({ error: 'Bouncer is currently unavailable' });
        }

        // Prevent conflicting bookings: check if bouncer has a CONFIRMED or ACTIVE slot at same date and time
        const { data: conflicts, error: conflictErr } = await supabaseAdmin
            .from('bookings')
            .select('id')
            .eq('bouncerId', bouncerId)
            .eq('date', new Date(date).toISOString())
            .eq('time', time)
            .in('status', ['CONFIRMED', 'ACTIVE'])
            .limit(1);

        if (conflictErr) throw conflictErr;
        if (conflicts && conflicts.length > 0) {
            return res.status(400).json({ error: 'Bouncer already has a confirmed booking for this date and time slot' });
        }

        // Server-side price calculation and verification
        const basePrice = pkg === 'VIP_BODYGUARD' ? 4000 : (bouncer.isGunman ? 3500 : 2000);
        const calculatedPrice = Math.round(basePrice * (duration / 4) * (duration > 6 ? 1.2 : 1));

        if (Math.abs(calculatedPrice - totalPrice) > 10) {
            return res.status(400).json({ error: `Price validation failed. Expected: ₹${calculatedPrice}, Got: ₹${totalPrice}` });
        }

        // Fetch client's contact number to denormalize into the booking
        const { data: clientUser } = await supabaseAdmin
            .from('users')
            .select('contactNo')
            .eq('id', userId)
            .single();
        const clientContactNo = clientUser?.contactNo || null;

        // Bundle coordinates into location if present
        let finalLocation = location || 'Location not specified';
        if (latitude !== undefined && longitude !== undefined && latitude !== null) {
            finalLocation = `${finalLocation}|COORDS:${latitude},${longitude}`;
        }

        // Parse and format the notes field with the manual payment metadata default values
        let transactionId = '';
        let userNotes = notes || '';
        if (notes) {
            const parts = notes.split(' | ');
            parts.forEach((part: string) => {
                if (part.startsWith('Txn ID: ')) {
                    transactionId = part.replace('Txn ID: ', '');
                }
            });
            userNotes = parts.filter((part: string) => !part.startsWith('Txn ID: ') && !part.startsWith('Payment Status: ') && !part.startsWith('Chat: ')).join(' | ');
        }
        const systemMessage = {
            id: 'sys-init-' + Date.now(),
            senderId: 'system',
            senderName: 'System',
            text: `Booking request created for ${date} at ${time}. Waiting for guard confirmation.`,
            mediaUrl: null,
            mediaType: null,
            timestamp: new Date().toISOString()
        };
        const finalNotes = formatNotesMetadata(userNotes, transactionId, 'PENDING', '', [systemMessage]);

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .insert({
                userId: userId,
                bouncerId: bouncerId,
                date: new Date(date).toISOString(),
                time: time,
                location: finalLocation,
                duration: duration || 4,
                totalPrice: calculatedPrice,
                package: pkg || 'SINGLE_SHIFT',
                notes: finalNotes,
                clientName: clientName,
                clientContactNo: clientContactNo,
                status: 'PENDING',
            })
            .select()
            .single();

        if (error) throw error;

        // ── 1. Real-time: emit socket event (works when app is open) ─────────
        getIO().emit('new-booking', {
            bouncerId: bouncerId,
            booking: camelCaseKeys(booking),
            clientName,
        });

        // ── 2. Push notification: works in background / killed state ─────────
        if (bouncer.userId) {
            const { data: userRow } = await supabaseAdmin
                .from('users')
                .select('fcm_token')
                .eq('id', bouncer.userId)
                .single();

            if (userRow?.fcm_token) {
                sendPushToToken(
                    userRow.fcm_token,
                    'New Hire Request! 🛡️',
                    `${clientName} wants to hire you${date ? ` on ${new Date(date).toLocaleDateString()}` : ''}.`,
                    {
                        type: 'BOOKING_REQUEST',
                        bookingId: booking.id,
                        clientName,
                    },
                ).catch(err => console.error('[FCM] Bouncer notify failed:', err?.code));
            } else {
                console.log('[FCM] Bouncer has no FCM token — push skipped');
            }
        }

        res.status(201).json(camelCaseKeys(booking));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserBookings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select('*, bouncers(*, users(name, profilePhoto, contactNo, email))')
            .eq('userId', userId)
            .order('createdAt', { ascending: false });

        if (error) throw error;

        const formattedBookings = (bookings || []).map((booking: any) => {
            const formatted = camelCaseKeys(booking);

            if (booking.bouncers) {
                const bouncer = Array.isArray(booking.bouncers) ? booking.bouncers[0] : booking.bouncers;
                if (bouncer) {
                    const formattedBouncer = camelCaseKeys(bouncer);
                    if (bouncer.users) {
                        const userObj = Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users;
                        if (userObj) {
                            formattedBouncer.name = formattedBouncer.name || userObj.name;
                            formattedBouncer.profilePhoto = formattedBouncer.profilePhoto || userObj.profile_photo || userObj.profilePhoto || bouncer.profile_image_url;
                        }
                    }
                    formatted.bouncer = formattedBouncer;
                }
                delete formatted.bouncers;
            }
            return formatted;
        });

        res.json(formattedBookings);
    } catch (error) {
        console.error('Get User Bookings Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



export const getPendingBookings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Find the bouncer profile associated with the user
        const { data: bouncer, error: bouncerError } = await supabaseAdmin
            .from('bouncers')
            .select('id')
            .eq('userId', userId)
            .single();

        if (!bouncer || bouncerError) {
            return res.status(404).json({ error: 'Bouncer profile not found' });
        }

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select('*, users(name, contactNo, email, profilePhoto)')
            .eq('bouncerId', bouncer.id)
            .eq('status', 'PENDING')
            .order('date', { ascending: true });

        if (error) throw error;

        const formattedBookings = bookings.map((booking: any) => {
            const formatted = camelCaseKeys(booking);
            if (booking.users) {
                const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                formatted.user = camelCaseKeys(user);
                delete formatted.users;
            }
            return formatted;
        });

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching pending bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // PENDING, CONFIRMED, ACTIVE, COMPLETED, REJECTED, CANCELLED
        const requestingUser = (req as any).user;

        const validStatuses = ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_PROOF_SUBMITTED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Fetch booking to verify current state and ownership
        const { data: bookingCheck, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('bouncerId, userId, status, clientName, date, notes')
            .eq('id', id)
            .single();

        if (fetchError || !bookingCheck) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Validate allowed state transitions
        const currentStatus = bookingCheck.status;
        const allowedTransitions: Record<string, string[]> = {
            'PENDING': ['ACCEPTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'],
            'ACCEPTED': ['PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED'],
            'PAYMENT_PENDING': ['PAYMENT_PROOF_SUBMITTED', 'CANCELLED'],
            'PAYMENT_PROOF_SUBMITTED': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['ACTIVE', 'CANCELLED'],
            'ACTIVE': ['COMPLETED'],
            'COMPLETED': [],
            'REJECTED': [],
            'CANCELLED': []
        };

        if (!allowedTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({ error: `Invalid state transition from ${currentStatus} to ${status}` });
        }

        // Authorize: check if requesting user is assigned bouncer, admin, or creator client
        let isAssignedBouncer = false;
        if (requestingUser.role === 'BOINTER' || requestingUser.role === 'BOUNCER' || requestingUser.role === 'GUNMAN') {
            const { data: bouncer } = await supabaseAdmin
                .from('bouncers')
                .select('id')
                .eq('userId', requestingUser.id)
                .single();
            if (bouncer && bouncer.id === bookingCheck.bouncerId) {
                isAssignedBouncer = true;
            }
        }
        const isAdmin = requestingUser.role === 'ADMIN';
        const isCreator = bookingCheck.userId === requestingUser.id;

        if (status === 'ACTIVE') {
            const { paymentStatus } = parseNotesMetadata(bookingCheck.notes);
            if (paymentStatus !== 'PAID') {
                return res.status(400).json({ error: 'Cannot start shift until payment is verified and PAID by admin.' });
            }
        }

        // Cancel can be done by creator client, bouncer, or admin. Other states require bouncer or admin.
        if (status === 'CANCELLED') {
            if (!isCreator && !isAssignedBouncer && !isAdmin) {
                return res.status(403).json({ error: 'Access denied. Only the client who created the booking, the bouncer, or an admin can cancel it.' });
            }
        } else {
            if (!isAssignedBouncer && !isAdmin) {
                return res.status(403).json({ error: 'Access denied. Only the assigned bouncer or admin can update status.' });
            }
        }

        // Append system message to chat log
        const { userNotes, transactionId, paymentStatus, paymentProofUrl, chat } = parseNotesMetadata(bookingCheck.notes);
        let systemText = `Status updated to ${status}.`;
        if (status === 'CONFIRMED') {
            systemText = `Guard accepted the request. You can now proceed to payment.`;
        } else if (status === 'REJECTED') {
            systemText = `Guard declined the booking request.`;
        } else if (status === 'CANCELLED') {
            systemText = `Booking was cancelled.`;
        } else if (status === 'ACTIVE') {
            systemText = `Guard started the shift. The engagement is now ACTIVE.`;
        } else if (status === 'COMPLETED') {
            systemText = `Guard completed the shift. The engagement is now COMPLETED.`;
        }

        const systemMessage = {
            id: 'sys-status-' + status.toLowerCase() + '-' + Date.now(),
            senderId: 'system',
            senderName: 'System',
            text: systemText,
            mediaUrl: null,
            mediaType: null,
            timestamp: new Date().toISOString()
        };
        chat.push(systemMessage);
        
        const updatedNotes = formatNotesMetadata(userNotes, transactionId, status === 'PAYMENT_PENDING' ? 'PENDING' : paymentStatus, paymentProofUrl, chat);

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .update({ status, notes: updatedNotes, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Fetch bouncer name for notifications
        const { data: bouncerObj } = await supabaseAdmin
            .from('bouncers')
            .select('name')
            .eq('id', booking.bouncerId)
            .single();
        const bouncerName = bouncerObj?.name || 'Security Detail';

        // ── Real-time & Push notification status updates ─────────────────────
        if (status === 'CANCELLED') {
            // Notify Bouncer of Client Cancellation
            const { data: bouncerProfile } = await supabaseAdmin
                .from('bouncers')
                .select('userId')
                .eq('id', booking.bouncerId)
                .single();
            if (bouncerProfile?.userId) {
                const { data: userRow } = await supabaseAdmin
                    .from('users')
                    .select('fcm_token')
                    .eq('id', bouncerProfile.userId)
                    .single();
                if (userRow?.fcm_token) {
                    sendPushToToken(
                        userRow.fcm_token,
                        'Booking Cancelled ❌',
                        `Client ${booking.clientName} has cancelled the booking request for ${new Date(booking.date).toLocaleDateString()}.`,
                        {
                            type: 'BOOKING_CANCELLED',
                            bookingId: booking.id,
                        }
                    ).catch(err => console.error('[FCM] Bouncer notify cancel failed:', err?.code));
                }
            }
        } else if (booking?.userId) {
            // Notify Client of Bouncer Action
            const { data: clientRow } = await supabaseAdmin
                .from('users')
                .select('fcm_token')
                .eq('id', booking.userId)
                .single();

            if (clientRow?.fcm_token) {
                let title = '';
                let body = '';
                let type = '';

                if (status === 'CONFIRMED') {
                    title = 'Booking Confirmed! ✅';
                    body = `Your security hire with ${bouncerName} has been confirmed.`;
                    type = 'HIRE_CONFIRMED';
                } else if (status === 'REJECTED') {
                    title = 'Booking Declined ❌';
                    body = `Bouncer ${bouncerName} is unavailable. Please try another bodyguard.`;
                    type = 'HIRE_REJECTED';
                } else if (status === 'ACTIVE') {
                    title = 'Guard Active! 🚨';
                    body = `${bouncerName} has started your security shift.`;
                    type = 'HIRE_ACTIVE';
                } else if (status === 'COMPLETED') {
                    title = 'Shift Completed 🛡️';
                    body = `${bouncerName} has completed the security shift. Thank you!`;
                    type = 'HIRE_COMPLETED';
                }

                sendPushToToken(
                    clientRow.fcm_token,
                    title,
                    body,
                    {
                        type,
                        bookingId: booking.id,
                    },
                ).catch(err => console.error('[FCM] Client status notify failed:', err?.code));
            }
        }

        res.json(camelCaseKeys(booking));
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBouncerHistoryBookings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Find the bouncer profile associated with the user
        const { data: bouncer, error: bouncerError } = await supabaseAdmin
            .from('bouncers')
            .select('id')
            .eq('userId', userId)
            .single();

        if (!bouncer || bouncerError) {
            return res.status(404).json({ error: 'Bouncer profile not found' });
        }

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select('*, users(name, contactNo, email, profilePhoto)')
            .eq('bouncerId', bouncer.id)
            .in('status', ['CONFIRMED', 'REJECTED', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
            .order('updatedAt', { ascending: false });

        if (error) throw error;

        const formattedBookings = bookings.map((booking: any) => {
            const formatted = camelCaseKeys(booking);
            if (booking.users) {
                const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                formatted.user = camelCaseKeys(user);
                delete formatted.users;
            }
            return formatted;
        });

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching history bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateBookingPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body; // PENDING, PAID, FAILED, REFUNDED
        const requestingUser = (req as any).user;

        // Authorize: Only admin is allowed to update payment status
        if (requestingUser.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied. Only admins can verify payments.' });
        }

        if (!['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        // Fetch booking to verify ownership and read current notes
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Parse existing notes, update payment status in metadata, and format back
        const { userNotes, transactionId, paymentProofUrl, chat } = parseNotesMetadata(booking.notes);
        
        // Add system message to chat
        const systemMessage = {
            id: 'sys-admin-pay-' + paymentStatus.toLowerCase() + '-' + Date.now(),
            senderId: 'system',
            senderName: 'System',
            text: `Admin updated payment status to: ${paymentStatus}.`,
            mediaUrl: null,
            mediaType: null,
            timestamp: new Date().toISOString()
        };
        chat.push(systemMessage);

        const updatedNotes = formatNotesMetadata(userNotes, transactionId, paymentStatus, paymentProofUrl, chat);

        const { data: updatedBooking, error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({ notes: updatedNotes, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json(camelCaseKeys(updatedBooking));
    } catch (error) {
        console.error('Error updating booking payment status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBookingDetail = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        // Fetch booking with user and bouncer details
        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .select('*, users(id, name, contactNo, email, profilePhoto), bouncers(id, name, contactNo, profilePhoto, bio)')
            .eq('id', id)
            .single();

        if (error || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Security Check: Only the assigned bouncer or the user who created it can view
        const { data: bouncer } = await supabaseAdmin
            .from('bouncers')
            .select('userId')
            .eq('id', booking.bouncerId)
            .single();

        const isAssignedBouncer = bouncer?.userId === userId;
        const isCreator = booking.userId === userId;
        const isAdmin = (req as any).user.role === 'ADMIN';

        if (!isAssignedBouncer && !isCreator && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const formatted = camelCaseKeys(booking);
        if (booking.users) {
            formatted.user = camelCaseKeys(booking.users);
            delete formatted.users;
        }
        if (booking.bouncers) {
            formatted.bouncer = camelCaseKeys(booking.bouncers);
            delete formatted.bouncers;
        }

        res.json(formatted);
    } catch (error) {
        console.error('Get Booking Detail Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const postChatMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const userName = (req as any).user.name || 'User';
        const { id } = req.params;
        const { text, mediaUrl, mediaType } = req.body;

        // Fetch booking
        const { data: booking, error: fetchErr } = await supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Security check: only user or bouncer of the booking can chat
        const { data: bouncer } = await supabaseAdmin
            .from('bouncers')
            .select('userId, name')
            .eq('id', booking.bouncerId)
            .single();

        const isBouncer = bouncer?.userId === userId;
        const isClient = booking.userId === userId;

        if (!isBouncer && !isClient) {
            return res.status(403).json({ error: 'Unauthorized to participate in this chat' });
        }

        // Parse existing metadata
        const { userNotes, transactionId, paymentStatus, paymentProofUrl, chat } = parseNotesMetadata(booking.notes);

        // Append new message
        const newMessage = {
            id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            senderId: userId,
            senderName: userName,
            text: text || '',
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null, // 'voice' | 'image'
            timestamp: new Date().toISOString()
        };
        chat.push(newMessage);

        // Format and save back
        const updatedNotes = formatNotesMetadata(userNotes, transactionId, paymentStatus, paymentProofUrl, chat);
        
        const { data: updatedBooking, error: updateErr } = await supabaseAdmin
            .from('bookings')
            .update({ notes: updatedNotes, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateErr) throw updateErr;

        // Notify recipient via Push Notifications
        if (isClient && bouncer?.userId) {
            const { data: bouncerUser } = await supabaseAdmin
                .from('users')
                .select('fcm_token')
                .eq('id', bouncer.userId)
                .single();
            if (bouncerUser?.fcm_token) {
                sendPushToToken(bouncerUser.fcm_token, 'New Message from Client', text || 'Sent an attachment', {
                    type: 'chat',
                    bookingId: id
                }).catch(err => console.error('[FCM] Bouncer notify failed:', err));
            }
        } else if (isBouncer && booking.userId) {
            const { data: clientUser } = await supabaseAdmin
                .from('users')
                .select('fcm_token')
                .eq('id', booking.userId)
                .single();
            if (clientUser?.fcm_token) {
                sendPushToToken(clientUser.fcm_token, `New Message from ${bouncer?.name || 'Guard'}`, text || 'Sent an attachment', {
                    type: 'chat',
                    bookingId: id
                }).catch(err => console.error('[FCM] Client notify failed:', err));
            }
        }

        res.json(camelCaseKeys(updatedBooking));
    } catch (err: any) {
        console.error('Post chat message error:', err);
        res.status(500).json({ error: err.message || 'Failed to send message' });
    }
};

export const submitPaymentDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { transactionId, paymentProofUrl } = req.body;

        if (!transactionId && !paymentProofUrl) {
            return res.status(400).json({ error: 'Transaction ID or Payment Proof is required' });
        }

        // Fetch booking
        const { data: booking, error: fetchErr } = await supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Only the client who created the booking can submit payment
        if (booking.userId !== userId) {
            return res.status(403).json({ error: 'Only the client can submit payment details' });
        }

        // Parse existing metadata
        const { userNotes, chat } = parseNotesMetadata(booking.notes);

        // Add system message to chat
        const systemMessage = {
            id: 'sys-pay-' + Date.now(),
            senderId: 'system',
            senderName: 'System',
            text: `Payment submitted (Txn ID: ${transactionId || 'Attached Proof'}). Waiting for admin verification.`,
            mediaUrl: paymentProofUrl || null,
            mediaType: paymentProofUrl ? 'image' : null,
            timestamp: new Date().toISOString()
        };
        chat.push(systemMessage);

        // Format new notes
        const updatedNotes = formatNotesMetadata(userNotes, transactionId || '', 'PAYMENT_PROOF_SUBMITTED', paymentProofUrl || '', chat);

        const { data: updatedBooking, error: updateErr } = await supabaseAdmin
            .from('bookings')
            .update({ notes: updatedNotes, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        res.json(camelCaseKeys(updatedBooking));
    } catch (err: any) {
        console.error('Submit payment details error:', err);
        res.status(500).json({ error: err.message || 'Failed to submit payment details' });
    }
};

export const rateBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rating, reviewText } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const { data: booking, error: bErr } = await supabaseAdmin
            .from('bookings')
            .select('*, bouncers(*)')
            .eq('id', id)
            .single();

        if (bErr || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const bouncer = booking.bouncers;
        if (!bouncer) {
            return res.status(400).json({ error: 'No bouncer assigned to this booking' });
        }

        const currentRating = bouncer.rating || 4.8;
        const currentCount = bouncer.rating_count || 1;
        const newCount = currentCount + 1;
        const newRating = Number((((currentRating * currentCount) + Number(rating)) / newCount).toFixed(1));

        await supabaseAdmin
            .from('bouncers')
            .update({
                rating: newRating,
                rating_count: newCount,
                updatedAt: new Date().toISOString()
            })
            .eq('id', bouncer.id);

        try {
            const { data: bouncerUser } = await supabaseAdmin
                .from('users')
                .select('fcm_token')
                .eq('id', bouncer.userId)
                .single();

            if (bouncerUser?.fcm_token) {
                const stars = '⭐'.repeat(Math.round(rating));
                await sendPushToToken(
                    bouncerUser.fcm_token,
                    'New Client Rating! ' + stars,
                    `A client rated your security service ${rating} stars! New average rating: ${newRating}`,
                    { bookingId: id, type: 'RATING_RECEIVED', rating: String(rating) }
                );
            }
        } catch (fcmErr) {
            console.error('[RateBooking] Push notification error:', fcmErr);
        }

        res.json({
            message: 'Rating submitted successfully',
            newRating,
            ratingCount: newCount
        });
    } catch (error: any) {
        console.error('[RateBooking] Error:', error);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
};


