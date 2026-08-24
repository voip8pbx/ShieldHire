
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

// Map of socketId -> { bouncerId, lat, lng }
export const onlineBouncers = new Map<string, { bouncerId: string; lat: number; lng: number }>();

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'https://shield-hire-znyu.vercel.app'];

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                const isAllowed = allowedOrigins.includes(origin) ||
                                  origin.startsWith('http://localhost') ||
                                  origin.startsWith('http://192.168.') ||
                                  origin.startsWith('http://10.');
                if (isAllowed) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Bouncers register themselves with their current location
        socket.on('register-bouncer', (data: { bouncerId: string; lat: number; lng: number }) => {
            if (!data?.bouncerId) return;
            onlineBouncers.set(socket.id, data);
            socket.join('bouncers');
            console.log(`[SOS] Bouncer registered: ${data.bouncerId} at (${data.lat}, ${data.lng})`);
        });

        socket.on('disconnect', () => {
            onlineBouncers.delete(socket.id);
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        console.warn('⚠️ Socket.io not initialized! Signal will not be sent via Socket.io (Expected in Serverless)');
        return {
            emit: (...args: any[]) => {
                console.log('Socket.emit (NO-OP in serverless):', args[0]);
                return true;
            },
            to: () => ({ emit: () => {} })
        } as any;
    }
    return io;
};
