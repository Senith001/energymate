import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Household from './src/models/Household.js';
import Appliance from './src/models/Appliance.js';

dotenv.config();

async function debugDashboard() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check all households
    const households = await Household.find().sort({ updatedAt: -1 });
    console.log('\n--- ALL HOUSEHOLDS (Sorted by latest update) ---');
    households.forEach(h => {
      console.log(`ID: ${h._id} | Name: ${h.name} | User: ${h.userId} | Updated: ${h.updatedAt}`);
    });

    if (households.length > 0) {
      const h = households[0];
      const apps = await Appliance.find({ householdId: h._id });
      console.log(`\n--- TARGET HOUSEHOLD: ${h.name} (${h._id}) ---`);
      console.log('Total Appliances Found:', apps.length);
      apps.forEach(a => console.log(`- ${a.name} (${a.wattage}W)`));
    } else {
      console.log('\nNo households found in DB!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Debug script failed:', err);
    process.exit(1);
  }
}

debugDashboard();
