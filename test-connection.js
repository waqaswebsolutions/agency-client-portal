// test-connection.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const testConnection = async () => {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('-----------------------------------');
  
  // Check if MONGODB_URI exists
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local file');
    console.log('Please make sure your .env.local file contains:');
    console.log('MONGODB_URI=your_mongodb_connection_string');
    process.exit(1);
  }

  // Show connection string (hiding password)
  const hiddenUri = process.env.MONGODB_URI.replace(
    /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
    'mongodb$1://$2:****@'
  );
  console.log('📌 Connection URI:', hiddenUri);

  try {
    console.log('⏳ Attempting to connect...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ SUCCESS: Connected to MongoDB!');
    
    // Get database info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 Database: ${db.databaseName}`);
    console.log(`📁 Collections: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    // Provide specific troubleshooting based on error
    if (error.message.includes('getaddrinfo')) {
      console.log('\n🔧 TROUBLESHOOTING: DNS resolution failed');
      console.log('1. Check if cluster name is correct in connection string');
      console.log('2. Try flushing DNS: ipconfig /flushdns');
      console.log('3. Check your internet connection');
    } 
    else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 TROUBLESHOOTING: Authentication failed');
      console.log('1. Check username and password in connection string');
      console.log('2. Make sure password has no special characters (or is URL encoded)');
      console.log('3. Verify database user exists in Atlas → Database Access');
    }
    else if (error.message.includes('timed out')) {
      console.log('\n🔧 TROUBLESHOOTING: Connection timeout');
      console.log('1. Your IP might not be whitelisted');
      console.log('2. Check if you have VPN/firewall blocking port 27017');
      console.log('3. Try adding 0.0.0.0/0 to IP whitelist (temporary)');
    }
  } finally {
    process.exit();
  }
};

testConnection();