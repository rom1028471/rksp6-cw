const { seedDatabase } = require('./src/utils/seedData');
const db = require('./src/models');

async function runSeed() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    
    console.log('Syncing database models...');
    await db.sequelize.sync({ force: true }); // Use force: true to drop and recreate tables
    
    console.log('Running seed data...');
    await seedDatabase();
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

runSeed(); 