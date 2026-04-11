import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const HouseholdSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  occupants: { type: Number, required: true },
  monthlyKwhTarget: Number,
  monthlyCostTarget: Number,
  currency: { type: String, default: 'LKR' }
});

const Household = mongoose.model('Household', HouseholdSchema);

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const testData = {
      userId: '699df6d8edb29edcf4b7c26e',
      name: 'Test Household ' + Date.now(),
      city: 'Test City',
      occupants: 4,
      monthlyKwhTarget: 200,
      monthlyCostTarget: 8000,
      currency: 'LKR'
    };
    
    const newHousehold = await Household.create(testData);
    console.log('Successfully saved to DB:', newHousehold._id);
    
    // Verify it exists
    const found = await Household.findById(newHousehold._id);
    console.log('Verification check (found in DB):', !!found);
    
    // Cleanup
    await Household.findByIdAndDelete(newHousehold._id);
    console.log('Cleanup: Test record deleted.');
    
    process.exit(0);
  } catch (err) {
    console.error('Save failed:', err);
    process.exit(1);
  }
}
test();
