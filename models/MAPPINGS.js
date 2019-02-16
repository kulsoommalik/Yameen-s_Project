const mongoose = require('mongoose');

let mappingSchema = mongoose.Schema({
    mainAccount: String,
    password: String,
    subAccount: String,
    username: String
});

var MAPPINGS_MODEL = mongoose.model('mappings', mappingSchema);

module.exports = {MAPPINGS_MODEL};