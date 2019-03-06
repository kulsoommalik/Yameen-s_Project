const {USER_MODEL} = require('./../models/USER');
const {ADMIN_MODEL} = require('./../models/ADMINS');

//middleware for authenitication
var authenticateUser = (req,res,next)=>{
    var token = req.header('x-auth');

    USER_MODEL.findByToken(token).then((user)=>{                 //model method
       if(!user){
            return Promise.reject();
        }
        req.user = user;
        req.token = token;
        next();
    }).catch((e)=>{
        res.status(404).send('authenticate error');
    });
};
var authenticateAdmin = (req,res,next)=>{
    var token = req.header('x-auth');

    ADMIN_MODEL.findByToken(token).then((admin)=>{                 //model method
       if(!admin){
            return Promise.reject();
        }
        //deleting last token from array
        //await ADMIN_MODEL.findOneAndUpdate({'tokens.token': token}, {$pull: {tokens: {token: token}}});
        //token = await admin.generateAuthToken();
        req.user = admin;
        req.token = token;
        next();
    }).catch((e)=>{
        res.status(404).send('authenticate error');
    });
};

module.exports = {authenticateUser, authenticateAdmin};