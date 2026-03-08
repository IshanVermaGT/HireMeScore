const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config(); // ← THIS LINE IS CRITICAL!

const serviceAccount = require('./serviceAccountKey.json');

console.log('Storage bucket from env:', process.env.FIREBASE_STORAGE_BUCKET); // Debug line

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET // ← Uses your bucket name
});

const bucket = admin.storage().bucket();

module.exports = {
    admin,
    bucket
};