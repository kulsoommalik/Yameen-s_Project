const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
    status: {
        type: String,
        required: false
    },
    balance: {
        default: 0
    },
    legalCompanyName: {
        type: String,
        required: true
    },
    corporateType: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    businessContact: {
        type: String,
        required: true
    },
    rateEmail: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: validator.isEmail,
          message: '{VALUE} is not a valid email'
        }
    },
    noticeEmail: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: validator.isEmail,
          message: '{VALUE} is not a valid email'
        }
    },
    balanceEmail: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: validator.isEmail,
          message: '{VALUE} is not a valid email'
        }
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    businessPhone: {
        type: String,
        required: true
    },
    mobilePhone: {
        type: String,
        required: true
    },
    skypeId: {
        type: String,
        default: null
    }
  });

  //middleware for password hashing before dumping to db
  UserSchema.pre('save', function (next){
    var user = this;
  
    if (user.isModified('password')) {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, (err, hash) => {
          user.password = hash;
          next();
        });
      });
    } else {
      next();
    }
  });
  

  var USER_MODEL = mongoose.model('user_accounts', UserSchema); 
  module.exports = {USER_MODEL};