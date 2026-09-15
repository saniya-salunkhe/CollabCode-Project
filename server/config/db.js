const mongoose = require('mongoose');
const dns = require('dns');


// ============================================================
// DNS FIX FOR MONGODB ATLAS
// ============================================================

// Some Windows/network DNS servers work with nslookup
// but refuse Node.js SRV queries.
//
// Force Node.js to use public DNS servers.
if (process.env.NODE_ENV !== 'production') {
  dns.setServers([
    '8.8.8.8',
    '1.1.1.1',
  ]);
}


// ============================================================
// CONNECT DATABASE
// ============================================================

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/collabcode';


    const conn =
      await mongoose.connect(
        mongoURI,
        {
          serverSelectionTimeoutMS: 15000,
        }
      );


    console.log(
      `✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );


    return conn;

  } catch (err) {
    console.error(
      '❌ MongoDB connection error:',
      err.message
    );


    if (
      process.env.NODE_ENV ===
      'production'
    ) {
      throw err;
    }


    return null;
  }
};


module.exports = connectDB;