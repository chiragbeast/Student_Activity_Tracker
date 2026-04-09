const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
    try {
        // Set DNS servers to Google's to fix ECONNREFUSED on some networks for Atlas SRV records
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student_activity');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
