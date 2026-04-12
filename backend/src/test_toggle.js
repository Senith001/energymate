import mongoose from 'mongoose';
import 'dotenv/config';
import Feedback from './models/Feedback.js';

async function testToggle() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const feedback = await Feedback.findOne();
    if (!feedback) {
      console.log("No feedback found to test with.");
      return;
    }
    
    console.log("Found feedback:", feedback._id);
    console.log("Current showOnHome:", feedback.showOnHome);
    
    feedback.showOnHome = !feedback.showOnHome;
    await feedback.save();
    
    console.log("Saved successfully! New showOnHome:", feedback.showOnHome);
  } catch (err) {
    console.error("ERROR DURING TOGGLE TEST:", err);
  } finally {
    process.exit(0);
  }
}

testToggle();
