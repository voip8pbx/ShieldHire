
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
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
            }
        } as any;
    }
    return io;
};
