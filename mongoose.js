const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
try {
    mongoose.connect('mongodb://localhost:27017/myApp', {useNewUrlParser: true, useCreateIndex: true});
    console.log('Connected to mongoDb');
    
} catch (error) {
    console.log('Cannot connect to mongoDb');
}

module.exports = {mongoose};