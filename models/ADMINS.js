const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

var adminSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
          validator: validator.isEmail,
          message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    subAccount: [String]

});

//middleware for password hashing before dumping to db
adminSchema.pre('save',function (next){
    var admin = this;

    if(admin.isModified('password')){
        bcrypt.genSalt(10, (err, salt)=>{
            bcrypt.hash(admin.password, salt, (err, hash)=>{
                admin.password = hash;
                next();
            });
        });
    }
    else{
        next();
    }
});

var ADMIN_MODEL = mongoose.model('main_accounts', adminSchema);
module.exports = {ADMIN_MODEL};

