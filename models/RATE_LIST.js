const mongoose = require('mongoose');

var rateListSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    }
});

let RATE_LIST_MODEL = mongoose.model('rate_list', rateListSchema);
module.exports = {RATE_LIST_MODEL};