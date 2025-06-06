const { User, Track } = require('../models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Create directory for test audio files if it doesn't exist
const testAudioDir = path.join(__dirname, '../../uploads/test_audio');
if (!fs.existsSync(testAudioDir)) {
  fs.mkdirSync(testAudioDir, { recursive: true });
}

// Function to generate a simple test audio file
const generateTestAudioFile = (filename) => {
  const filePath = path.join(testAudioDir, filename);
  if (!fs.existsSync(filePath)) {
    // Create an empty MP3 file
    fs.writeFileSync(filePath, Buffer.alloc(1024));
  }
  return filePath;
};

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Create test users with different roles
    console.log('Creating test users...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    
    const regularUser1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'user'
    });
    
    const regularUser2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'user'
    });
    
    // Create some test tracks
    console.log('Creating test tracks...');
    const tracks = [
      {
        title: 'Admin Public Track',
        artist: 'Admin Artist',
        genre: 'Rock',
        file_path: generateTestAudioFile('admin_public_track.mp3'),
        userId: adminUser.id,
        is_public: true
      },
      {
        title: 'Admin Private Track',
        artist: 'Admin Artist',
        genre: 'Jazz',
        file_path: generateTestAudioFile('admin_private_track.mp3'),
        userId: adminUser.id,
        is_public: false
      },
      {
        title: 'User1 Public Track',
        artist: 'User1 Artist',
        genre: 'Pop',
        file_path: generateTestAudioFile('user1_public_track.mp3'),
        userId: regularUser1.id,
        is_public: true
      },
      {
        title: 'User1 Private Track',
        artist: 'User1 Artist',
        genre: 'Electronic',
        file_path: generateTestAudioFile('user1_private_track.mp3'),
        userId: regularUser1.id,
        is_public: false
      },
      {
        title: 'User2 Public Track',
        artist: 'User2 Artist',
        genre: 'Hip-Hop',
        file_path: generateTestAudioFile('user2_public_track.mp3'),
        userId: regularUser2.id,
        is_public: true
      }
    ];
    
    for (const trackData of tracks) {
      await Track.create(trackData);
    }
    
    console.log('Database seeding completed successfully!');
    return {
      users: {
        admin: adminUser,
        user1: regularUser1,
        user2: regularUser2
      },
      tracks
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

module.exports = {
  seedDatabase
}; 