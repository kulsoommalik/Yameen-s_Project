const mongoose = require('mongoose');

var statsSchema = mongoose.Schema({
    username: String,
    date: Number,
    totalCharges: String,
    rate: String,
    timeUsed: Number
});

var STATS_MODEL = mongoose.model('stats', statsSchema);

module.exports = {STATS_MODEL};