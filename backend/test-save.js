const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Define a simple test schema
    const TestSchema = new mongoose.Schema({
        test: String,
        createdAt: Date
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    // Try to save
    const testDoc = new Test({
        test: 'hello',
        createdAt: new Date()
    });
    
    await testDoc.save();
    console.log('✅ Test document saved!');
    
    // Read it back
    const found = await Test.findOne({ test: 'hello' });
    console.log('✅ Found test document:', found);
    
    // Clean up
    await Test.deleteMany({ test: 'hello' });
    console.log('✅ Test cleanup complete');
    
    process.exit(0);
})
.catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});