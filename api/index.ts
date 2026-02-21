import '../backend/src/init-env';
import app from '../backend/src/app';
import { connectDB } from '../backend/src/config/db';

// Vercel Serverless Function entry point
const init = async () => {
    try {
        await connectDB();
        console.log('Backend initialized for serverless');
    } catch (error) {
        console.error('Initialization error:', error);
    }
};

init();

// Export the Express app
export default app;
