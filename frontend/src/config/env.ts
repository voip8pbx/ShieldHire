/**
 * This file centralizes all environment variables for the frontend.
 * In a production setup, these would be managed by react-native-config or similar.
 */

export const ENV = {
    // Current Machine IP (Auto-updated or defined in .env)
    MACHINE_IP: '10.59.243.154',
    
    // API Configurations
    API_PORT: '5000',
    DEV_BASE_URL: 'http://10.59.243.154:5000',
    PROD_BASE_URL: 'https://shield-hire-znyu.vercel.app',

    // Google Services
    GOOGLE_MAPS_API_KEY: 'AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs',
    
    // Supabase (Mirrored from root .env)
    SUPABASE_URL: 'https://yoshgwtufyjjfqittrhb.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc2hnd3R1ZnlqamZxaXR0cmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTg5OTMsImV4cCI6MjA4NzEzNDk5M30.9Q20Su-q-ODH-OGBqp3OyPoEDHDRRHW8sA3KtiAtbf8'
};
