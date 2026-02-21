import './init-env';
import app from './app';
import { createServer } from 'http';
import { connectDB } from './config/db';
import { initSocket } from './socket';

// import { PrismaClient } from '@prisma/client';


const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} and accessible on 0.0.0.0`);
    });
};

startServer();
