// Deprecated: Prisma Client replaced by Supabase Client
// This file is kept for compatibility with existing imports, but logic is disabled.

const connectDB = async () => {
    console.log('✅ App configured to use Supabase via REST API (Prisma Disabled)');
};

// Export a dummy object to prevent runtime crashes if some file still imports it
// (But it should fail visibly if used, so we can fix it)
const prisma: any = new Proxy({}, {
    get: (_target, prop) => {
        throw new Error(`Attempted to use Prisma.${String(prop)} but Prisma has been replaced by Supabase.`);
    }
});

export { connectDB };
export default prisma;

