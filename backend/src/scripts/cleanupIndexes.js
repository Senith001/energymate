import mongoose from 'mongoose';
import 'dotenv/config';

async function dropLegacyIndexes() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI not found in .env');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const collection = mongoose.connection.db.collection('recommendations');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    const toDrop = ['userId_1_month_1', 'userId_1', 'month_1'];
    for (const name of toDrop) {
      if (indexes.find(i => i.name === name)) {
        await collection.dropIndex(name);
        console.log(`Dropped legacy index: ${name}`);
      }
    }
    
    console.log('Cleanup complete');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

dropLegacyIndexes();
