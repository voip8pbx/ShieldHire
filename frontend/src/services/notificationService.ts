import notifee, { AndroidImportance, TimestampTrigger, TriggerType, AuthorizationStatus } from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
    async requestPermission() {
        const settings = await notifee.requestPermission();

        if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
            console.log('Notification permission granted');
            return true;
        } else {
            console.log('Notification permission denied');
            return false;
        }
    }

    async createChannel() {
        // Create a channel (required for Android)
        const channelId = await notifee.createChannel({
            id: 'bookings',
            name: 'Booking Notifications',
            lights: true,
            vibration: true,
            importance: AndroidImportance.HIGH,
        });
        return channelId;
    }

    async displayBookingNotification(clientName: string, bookingDate: string, bookingId: string) {
        const channelId = await this.createChannel();

        // Display a notification
        await notifee.displayNotification({
            title: 'New Hire Request! 🛡️',
            body: `${clientName} wants to hire you for ${bookingDate}. Please confirm your availability.`,
            data: { bookingId },
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
                // Add actions for quick confirmation if needed
                actions: [
                    {
                        title: 'Confirm Availability',
                        pressAction: { id: 'confirm' },
                    },
                    {
                        title: 'Decline',
                        pressAction: { id: 'decline' },
                    },
                ],
            },
            ios: {
                foregroundPresentationOptions: {
                    badge: true,
                    sound: true,
                    banner: true,
                    list: true,
                },
            },
        });
    }
}

export const notificationService = new NotificationService();
