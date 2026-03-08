const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['technical', 'non-technical'],
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    cgpa: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    githubProfile: {
        type: String,
        required: function() {
            return this.userType === 'technical';
        }
    },
    resumeUrl: {
        type: String
    },
    analyses: [{
        date: {
            type: Date,
            default: Date.now
        },
        hireMeScore: Number,
        feedback: String,
        skillsAnalysis: Object,
        resumeText: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);