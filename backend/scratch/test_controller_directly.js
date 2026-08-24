const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Register ts-node to import TypeScript files directly
require('ts-node').register({
  project: path.resolve(__dirname, '../tsconfig.json')
});

const { updateProfile } = require('../src/controllers/userController');

async function run() {
  const mockReq = {
    user: {
      id: '723ea70d-c24c-4a89-b626-966fce53af3d',
      email: '0201it221018@gmail.com',
      role: 'BOUNCER'
    },
    body: {
      name: 'Animesh yadav',
      contactNo: '9876543210',
      profilePhoto: 'https://avatar.placeholder',
      bouncerProfile: {
        age: '50',
        gender: 'Male',
        registrationType: 'Individual',
        isGunman: false,
        bio: 'Experienced bouncer',
        upiId: 'animesh@upi',
        skills: ['Security', 'Crowd Control'],
        experience: '10',
        gallery: []
      }
    }
  };

  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log(`\nResponse JSON (status ${this.statusCode}):`, JSON.stringify(data, null, 2));
      return this;
    }
  };

  try {
    console.log("Calling updateProfile controller directly...");
    await updateProfile(mockReq, mockRes);
  } catch (err) {
    console.error("❌ Exception caught from controller execution:", err);
  }
}

run();
