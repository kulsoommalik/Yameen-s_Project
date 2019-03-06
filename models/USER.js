const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var secret = "crm420";
var UserSchema = new mongoose.Schema({
    role: {
      type: String,
      default: 'User'
    },
    status: {
        type: String,
        default: 'DISABLED'
    },
    balance: {
        type: Number,
        default: 0
    },
    rate: {
      type: Number,
      default: 0
    },
    suspendLimit: {
      type: Number,
      default: 0
    },
    blockIP : {
      type: Boolean,
      default: true
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
    },
    tokens: [{
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }]
  
  });
  UserSchema.methods.generateAuthToken = function () {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString(), access}, secret, {expiresIn: 3000}).toString();
  
    user.tokens.push({access, token});
    return user.save().then(() => {
      return token;
    });
  };
  
  UserSchema.statics.findByToken = function (token) {
    var User = this;
    var decoded;
  
    try {
      decoded = jwt.verify(token, secret);
    } catch (e) {
      return Promise.reject();
    }
  
    return User.findOne({
      '_id': decoded._id,
      'tokens.token': token,
      'tokens.access': 'auth'
    });
  };

  UserSchema.statics.findByCredentials = function (username, password) {
    var User = this;
    return User.findOne({username}).then((user) => {
      if (!user) {
        return Promise.reject();
      }
  
      return new Promise((resolve, reject) => {
        // Use bcrypt.compare to compare password and user.password
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            resolve(user);
          } else {
            reject();
          }
        });
      });
    });
  };

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