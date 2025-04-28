const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    alias: { type: String, required: true },
    age: { type: Number, required: true },
    isBanned: { type: Boolean, default: false },
    spamCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
