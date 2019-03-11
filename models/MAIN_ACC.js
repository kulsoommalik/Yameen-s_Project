const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secret = "crm420";
var mainAccSchema = mongoose.Schema({
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

// mainAccSchema.methods.generateAuthToken = function () {
//     var user = this;
//     var access = 'auth';
//     var token = jwt.sign({_id: user._id.toHexString(),email: user.email, access}, secret, {expiresIn: 3000}).toString();
  
//     user.tokens.push({access, token});
//     return user.save().then(() => {
//       return token;
//     });
//   };
  
//   mainAccSchema.statics.findByToken = function (token) {
//     var User = this;
//     var decoded;
  
//     try {
//       decoded = jwt.verify(token, secret);      
//     } catch (e) {
//       return Promise.reject();
//     }
  
//     return User.findOne({
//       '_id': decoded._id,
//       'tokens.token': token,
//       'tokens.access': 'auth'
//     });
//   };

//   mainAccSchema.statics.findByCredentials = function (email, password) {
//     var User = this;
//     return User.findOne({email}).then((user) => {
//       if (!user) {
//         return Promise.reject();
//       }
  
//       return new Promise((resolve, reject) => {
//         // Use bcrypt.compare to compare password and user.password
//         bcrypt.compare(password, user.password, (err, res) => {
//           if (res) {
//             resolve(user);
//           } else {
//             reject();
//           }
//         });
//       });
//     });
//   };

//middleware for password hashing before dumping to db
mainAccSchema.pre('save',function (next){
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

var MAIN_ACC_MODEL = mongoose.model('main_accounts', mainAccSchema);
module.exports = {MAIN_ACC_MODEL};

