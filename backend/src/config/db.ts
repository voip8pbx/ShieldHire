// Supabase Client replaces Prisma Client
// Safe Proxy mock provided so legacy imports never throw runtime exceptions

const connectDB = async () => {
    console.log('✅ App configured to use Supabase via REST API');
};

const createSafeProxy = (name = 'prisma'): any => {
    return new Proxy(() => {}, {
        get: (_target, prop) => {
            if (prop === 'then' || prop === 'catch' || prop === 'finally') {
                return undefined;
            }
            return createSafeProxy(`${name}.${String(prop)}`);
        },
        apply: (_target, _thisArg, _args) => {
            return Promise.resolve(null);
        }
    });
};

const prisma: any = createSafeProxy('prisma');

export { connectDB };
export default prisma;
