const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    name: { type: String, required: true },
    madeBy: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String, required: true }
});

module.exports = mongoose.model('Ad', adSchema);