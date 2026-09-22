
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all bouncers...');
    const bouncers = await prisma.bouncer.findMany({
        include: {
            user: true,
        },
    });

    console.log(`Found ${bouncers.length} bouncers.`);

    bouncers.forEach((bouncer) => {
        console.log('--------------------------------------------------');
        console.log(`Bouncer ID: ${bouncer.id}`);
        console.log(`Name: ${bouncer.name}`);
        console.log('Bouncer Profile Photo:', bouncer.profilePhoto ? (bouncer.profilePhoto.startsWith('data:') ? 'Base64 Encoded (Length: ' + bouncer.profilePhoto.length + ')' : bouncer.profilePhoto) : 'NULL');
        console.log('User Profile Photo:', bouncer.user?.profilePhoto ? (bouncer.user.profilePhoto.startsWith('data:') ? 'Base64 Encoded (Length: ' + bouncer.user.profilePhoto.length + ')' : bouncer.user.profilePhoto) : 'NULL');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
