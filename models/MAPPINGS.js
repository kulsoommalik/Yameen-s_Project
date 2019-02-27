const mongoose = require('mongoose');

let mappingSchema = mongoose.Schema({
    username: String,
    mainAccount: String,
    password: String,
    subAccount: String
});

var MAPPINGS_MODEL = mongoose.model('mappings', mappingSchema);

module.exports = {MAPPINGS_MODEL};