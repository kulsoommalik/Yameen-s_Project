const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const csv = require('fast-csv');
const multer = require('multer');
const path = require('path');
const upload = require('express-fileupload');

const {mongoose} = require('./mongoose');

const {USER_MODEL} = require('./models/USER');
const {ADMIN_MODEL} = require('./models/ADMINS');
const {RATE_LIST_MODEL} = require('./models/RATE_LIST');
const {STATS_MODEL} = require('./models/STATS');
const {MAPPINGS_MODEL} = require('./models/MAPPINGS');
const {USER_IP_MODEL} = require('./models/USER_IPS');

const {sendEmail} = require('./functions/send-email');
const {getData} = require('./functions/get-data');
const {getSubAccounts} = require('./functions/get-unassigned-subAccounts');

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(upload());

app.post('/newUpload', (req, res)=>{
    if(req.files){
        // console.log(req.files);
        // console.log(req.body.filename);
        //  console.log(req.files.file.name);
        var file = req.files.file;
        var filename = file.name;
        var filepath = path.join(__dirname, '/public/uploads/');
        var targetPath = filepath+ filename;        

        file.mv(targetPath, function(err){
            if(err){
                return res.status(404).send(err);
            }
            else{
                return res.send('file uploaded');
            }
        });

        // var file = req.files.file;
        // var filename = file.name;
        // var tmpFilepath = req.files.file.tempFilePath;
        // var filepath = path.join(__dirname, 'uploads/') + filename;
        // fs.rename(tmpFilepath, filepath, function(err){
        //     if (err){
        //         return res.send(err);
        //     }
        //     // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        //     fs.unlink(tmpFilepath, function(err) {
        //         if (err){
        //             return res.send(err);
        //         }
        //         res.send('File uploaded to: ' + filepath);
        //     });
    
        // });        
    }
});

// const upload = multer({ dest: 'tmp/csv/' });    //folder for  files

// //7 === uploading csv/pdf file -> req: filename, filepath
// app.post('/upload-file', upload.single('file') ,(req, res)=>{

//     const fileRows = [];
//     // open uploaded file
//     csv.fromPath(req.file.path).on("data", (data)=>{
//         fileRows.push(data); // push each row
//     }).on("end",()=>{
//         console.log(fileRows)
//         fs.unlinkSync(req.file.path);   // remove temp file
//         //process "fileRows" and respond
//         res.send(fileRows);
//     });
// });


//1 === user Signup
app.post('/signup', (req, res)=>{

    if(req.body.password !== req.body.retypePassword){
        return res.status(404).send('Passwords not matched');
    }
    var user = new USER_MODEL({
        legalCompanyName: req.body.legalCompanyName,
        corporateType: req.body.corporateType,
        username: req.body.username,
        password: req.body.password,
        businessContact: req.body.businessContact,
        rateEmail: req.body.rateEmail,
        noticeEmail: req.body.noticeEmail,
        balanceEmail: req.body.balanceEmail,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        country: req.body.country,
        businessPhone: req.body.businessPhone,
        mobilePhone: req.body.mobilePhone,
        skypeId: req.body.skypeId
    });
    
    user.save().then((doc)=>{
        res.send({status: 'saved', data: doc});        

        // sendind email to admin work
        sendEmail({
            user: 'kikis.art22@gmail.com',
            pass: '<Karachi90!!1/>'
        }, {
            from: '"Kikis art" kikis.art22@gmail.com',
            to: 'm.kulsoom22@gmail.com',
            subject: 'node mailer',
            text: doc.toString()
        });
        //===================

    }).catch((e)=>{
        res.status(404).send(e);
    });
});

//2 === user/admin login -> req: username/email, password
app.get('/login', (req, res)=>{
    
    if(req.body.hasOwnProperty('email')){
        ADMIN_MODEL.find({email: req.body.email},{password:1}).then((data)=>{

            let hashedPassword = data[0].password;
            //comparing password
            bcrypt.compare(req.body.password, hashedPassword).then((result)=>{
                if(result){
                    res.send({status: 'logged in', admin: req.body.email});
                }
                else{
                    res.status(404).send('incorrect password');
                }
            }).catch((e)=>{
                res.status(404).send('decrypting error');
            });
        }).catch((e)=>{
            res.status(404).send('admin not found');
        });    
    }
    else if(req.body.hasOwnProperty('username')){
        USER_MODEL.find({username: req.body.username},{password:1}).then((data)=>{

            let hashedPassword = data[0].password;
            //comparing password
            bcrypt.compare(req.body.password, hashedPassword).then((result)=>{
                if(result){
                    res.send({status: 'logged in', user: req.body.username});
                }
                else{
                    res.status(404).send('incorrect password');
                }
            }).catch((e)=>{
                res.status(404).send('decrypting error');
            });
        }).catch((e)=>{
            res.status(404).send('user not found');
        });    
    }
});

//3 === Get user profile -> req: username, show all fields
app.get('/get-user-profile', (req, res)=>{
    
    USER_MODEL.find({username: req.body.username}).then((user_data)=>{
        res.send(user_data);
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

//4 === Get all users -> nothing given , show few fields
app.get('/get-all-users', (req, res)=>{
    
    USER_MODEL.find({},{username:1, password:1}).then((user_data)=>{
        res.send(user_data);        
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

//5 === Seding confirmation email to user and updating status -> req: username
app.post('/confirm-email', (req, res)=>{

    USER_MODEL.find({username: req.body.username}, {noticeEmail:1}).then((data)=>{
        sendEmail({
            user: 'kikis.art22@gmail.com',
            pass: '<Karachi90!!1/>'
        }, {
            from: '"Kikis art" kikis.art22@gmail.com',
            to: data[0].noticeEmail,
            subject: 'Confirmation Email',
            text: `hey !! ${req.body.username} Welcome to blah blah`
        });
        //updating status
        USER_MODEL.findOneAndUpdate({username: req.body.username}, {$set: {status: 'ENABLED'}}, {new: true}).then(()=>{
            console.log('status changed!!');
        });

        res.send('Email sent');
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

//6 === updating user fields -> req: username, updated fields
app.post('/update-user', (req, res)=>{

    USER_MODEL.findOneAndUpdate({username: req.body.username}, {$set: req.body}, {new: true}).then((data)=>{
        let user = req.body.username;

        if(req.body.hasOwnProperty('balance')){
            let previousBalance;
            USER_MODEL.find({username: req.body.username}, {balance:1}).then((bal)=>{
            previousBalance = bal[0].balance;
            }).catch((e)=>{
                console.log(e);
            });

            sendEmail({
                user: 'kikis.art22@gmail.com',
                pass: '<Karachi90!!1/>'
            }, {
                from: '"Kikis art" kikis.art22@gmail.com',
                to: data.balanceEmail,
                subject: 'Balance Changed',
                text: `hey !! ${req.body.username} your balance has been changed from ${previousBalance} to ${req.body.balance}`
            });

            if(req.body.balance > 0){                
                USER_MODEL.findOneAndUpdate({username: req.body.username}, {$set: {blockIP: false}}).exec();
            }
            else if(req.body.balance <= 0){
                USER_MODEL.findOneAndUpdate({username: req.body.username}, {$set: {blockIP: true}}).exec();
            }            
            delete req.body.username;
            delete req.body.balance;
        }
        //seding email when other fields changed

        if(Object.keys(req.body).length > 0){            
            let reqString = req.body.toString();
            sendEmail({
                user: 'kikis.art22@gmail.com',
                pass: '<Karachi90!!1/>'
            }, {
                from: '"Kikis art" kikis.art22@gmail.com',
                to: data.noticeEmail,
                subject: 'Fields Changed',
                text: `hey !! ${user} following fields has been changed!!! ${reqString}`
            });
        }        
        res.send({data});

    }).catch((e)=>{
        res.status(404).send();
    });
});

//8 === admin signup -> req: email, pass
app.post('/admin-signup', (req, res)=>{

    let admin = new ADMIN_MODEL({
        email: req.body.email,
        password: req.body.password
    });
    
    admin.save().then((doc)=>{
        return res.send({status: 'Saved', data: doc});
    }, (e)=>{
        return res.status(404).send(e);
    });
});

//9 ===  adding sub account -> req: email, subaccount name
app.post('/add-sub-account', (req, res)=>{

    let isPresent = false;
    //checking if subAccount is unique
    ADMIN_MODEL.findOne({email: req.body.email}, {subAccount: 1}).then(async (data)=>{

        for(var i=0; i<data.subAccount.length; i++){
            if(req.body.subAccount === data.subAccount[i]){
                isPresent = true;
                break;
            }
        }
                
        if(!isPresent){
            ADMIN_MODEL.findOneAndUpdate({email: req.body.email}, {$push: {subAccount: req.body.subAccount}}, {new: true}).then((doc)=>{
                return res.send({status: 'updated', data: doc});
            }).catch((e)=>{
                return res.status(404).send(e);
            });
        }
        else{
            res.status(404).send('subAccount alreay exist');
        }
    }).catch((e)=>{
        res.status(404).send(e);
    });
});

//10 === Removing sub account -> req: email, subaccount name
app.delete('/remove-sub-account', (req,res)=>{

    ADMIN_MODEL.findOneAndUpdate({email: req.body.email}, {$pull: {subAccount: req.body.subAccount}}, {new:true}).then((data)=>{
        res.send(data);
    }).catch((e)=>{
        res.status(404).send(e);
    });
});

//11 === Remove admin -> req: email
app.delete('/remove-admin', (req, res)=>{
    
    ADMIN_MODEL.findOneAndRemove({email: req.body.email}).then((data)=>{
        res.send(data);
    }).catch((e)=>{
        res.status(404).send(e);
    });
});

//12 === Show all main accounts
app.get('/get-all-main-accounts', (req, res)=>{
    
    ADMIN_MODEL.find().then((data)=>{
        res.send(data);
    }).catch((e)=>{
        res.status(404).send(e);
    });
});

//13 === Show stats -> req: username
app.get('/get-stats', async (req,res)=>{

    res.send(await getData('stats', {username: req.body.username}, {}));
});

//14 === Forgot password -> req: newPassword, retypePassword, collectionName, username/email
app.post('/forgot-password',async (req, res)=>{

    if(req.body.newPassword !== req.body.retypePassword){
        return res.status(404).send('Passwords not matched');
    }
    //hashing password
    var myPromise = ()=>{
        return new Promise((resolve, reject)=>{
            bcrypt.genSalt(10, (err, salt)=>{
                bcrypt.hash(req.body.newPassword, salt, (err, hash)=>{
                    if(err)
                        reject(err);

                    resolve(hash);
                });
            });
        });
    };
    var callMyPromise = async()=>{
        var res = await (myPromise());
        return res;
    }
    var hashedPass = await callMyPromise();
    //--- hashing end ---
    
    if(req.body.collectionName === "user_account"){
        USER_MODEL.findOneAndUpdate({username: req.body.username}, {$set: {password: hashedPass}}, {new: true})
        .then(data =>{
            res.send(data);
        }).catch(e =>{
            res.status(404).send(e);
        });
    }
    if(req.body.collectionName === "main_accounts"){
        ADMIN_MODEL.findOneAndUpdate({email: req.body.email}, {$set: {password: hashedPass}}, {new: true})
        .then(data=>{
            res.send(data);
        }).catch(e=>{
            res.status(404).send(e);
        });
    }
});
//15 === Map user -> req: username(user), mainAccount(admin email), subAccount
app.post('/map-user', (req, res)=>{
    
    //user exists in USER_MODEL
    USER_MODEL.find({username: req.body.username}).then((d)=>{

        if(d.length !== 0){
            MAPPINGS_MODEL.find({username: req.body.username}).then((d)=>{
            
                if(d.length === 0){ //user not mapped
                    //if password is found that means mainAccount exists
                    ADMIN_MODEL.findOne({email: req.body.mainAccount}, {password:1, subAccount:1, _id:0}).then(async (data)=>{        
                        //check if subAccount is valid and subAccount is not already assigned
                        let sub = new Array();
                        sub = await getSubAccounts(req.body.mainAccount);
                        
                        if(sub.includes(req.body.subAccount)){ // if subAccount is from unassigned subaccounts  
                            //mapping new user object 
                            let mapUser = new MAPPINGS_MODEL({
                                username: req.body.username,
                                mainAccount: req.body.mainAccount,
                                password: data.password,
                                subAccount: req.body.subAccount
                            });
                            mapUser.save();
                            return res.send(mapUser);
                        }
                        return res.status(404).send('sub-account already assigned to another user or invalid!!');
    
                    }).catch(e=>{
                        return res.status(404).send('main-account not found!!!');
                    });
                }
                else{
                    return res.status(404).send('User already mapped!!');
                }
    
            }).catch((e)=>{
                res.status(404).send(e);
            });
        }
        else{
            return res.status(404).send('username does not exist!!');
        }

    }).catch((e)=>{
        return res.status(404).send(e);
    });

});

//16 === get unassigned sub-accounts -> req: mainAccount //gives available subaccounts of given email
app.get('/get-unassigned-subAccounts', async (req, res)=>{
    
    res.send(await getSubAccounts(req.body.mainAccount));
});

//17 === get main-accounts having unassigned sub-accounts
app.get('/get-mainAccounts-with-subAccounts', (req, res)=>{

    ADMIN_MODEL.find({}, {email:1, _id:0}).then(async (allEmails)=>{
        //console.log('allEmails', allEmails);  //all emails of admins
        
        var allSubAccounts = new Array();
        var  adminsHaveSubAccounts = new Array();

        for(var i=0; i < allEmails.length; i++){
            allSubAccounts[i] = await getSubAccounts(allEmails[i].email); //getting unAssigned subAccounts of one ith email
            if(allSubAccounts[i].length !== 0){
                adminsHaveSubAccounts[i] = allEmails[i];
            }
        }
        //console.log('admins having sub accs:',adminsHaveSubAccounts);
        res.send(adminsHaveSubAccounts);
        
    }).catch((e)=>{
        res.status(404).send();
    });
});

//18 === get all Mappings
app.get('/get-all-mappings', async(req, res)=>{
    
    res.send(await getData('mappings', {}, {}));
});

//19 === change mappings account -> req: username , main acc, sub acc
app.post('/update-mappings-account', (req, res)=>{

    MAPPINGS_MODEL.find({username: req.body.username}).then((d)=>{
        if(d.length !== 0){ //means user found

            ADMIN_MODEL.find({email: req.body.mainAccount}, {password:1, _id:0}).then(async(data)=>{
                if(data.length !== 0){  //means main acc exist
                    let sub = new Array();
                    sub = await getSubAccounts(req.body.mainAccount);

                    if(sub.includes(req.body.subAccount)){ //sub acc available                                            
                        MAPPINGS_MODEL.findOneAndUpdate({username: req.body.username}, {$set: {mainAccount: req.body.mainAccount, subAccount: req.body.subAccount, password: data[0].password}}, {new: true}).then((updatedData)=>{
                            return res.send({status: 'Updated', updatedData});
                        }).catch((e)=>{
                            return res.status(404).send(e);
                        });
                    }
                    else{
                        return res.status(404).send('sub account not available or invalid'); //sub acc is either not in available subAccs or invalid
                    }
                }
                else{
                    return res.status(404).send('main account does not exist');      
                }
            }).catch((e)=>{
                return res.status(404).send(e);        
            });
        }
        else{
            return res.status(404).send('User not mapped!!');
        }
    }).catch((e)=>{
        return res.status(404).send(e);        
    });
});

//20 === Remove mapping -> req: username
app.delete('/remove-mapping',(req, res)=>{

    MAPPINGS_MODEL.find({username: req.body.username}).then((d)=>{
        if(d.length !== 0){
            MAPPINGS_MODEL.find({username: req.body.username}).remove().exec();
            return res.send('User removed!!');
        }
        else{
            return res.status(404).send('User not found')      
        }
    }).catch((e)=>{
        return res.status(404).send(e); 
    });
});

//21 === adding/updating ip -> req: username, prevIp, newIp, enabled
app.post('/add-update-ip', async (req,res)=>{

    //check ip does not exist already for the username provided
    let userIps = await USER_IP_MODEL.find({username: req.body.username}, {ip:1, _id:0});        
    function checkIps(){
        return userIps.some(function(element){
            return element.ip === req.body.newIp;
        });
    };
    //1. check if user exists in USER_MODEL
    let user = await USER_MODEL.findOne({username: req.body.username});
    if(user){                
        if(req.body.prevIp == 'null' && req.body.newIp != 'null'){ // case Add -> add new user ip                        
            if(!checkIps()){ //if ip already doesnot exists                
                var user_ip = new USER_IP_MODEL({
                    username: req.body.username,
                    ip: req.body.newIp,
                    enabled: req.body.enabled
                });
                let savedData = await user_ip.save();    
                return res.send(savedData);
            }
            return res.status(404).send('ip already assigned');
        }
        else if(req.body.prevIp == req.body.newIp){                            // case Update -> 1. update only status            
            let updatedStatus = await USER_IP_MODEL.findOneAndUpdate({username:req.body.username, ip: req.body.prevIp}, {$set: {enabled:req.body.enabled}}, {new:true});            
            if(updatedStatus){
                return res.send(updatedStatus);
            }
            return res.status(404).send('user not found with given ip!!');
        }
        else if(req.body.prevIp != 'null' && req.body.prevIp != req.body.newIp){  // case update -> 2. updating ip
            if(!checkIps()){
                let updatedIp = await USER_IP_MODEL.findOneAndUpdate({username:req.body.username, ip:req.body.prevIp}, {$set: {ip:req.body.newIp}}, {new: true});
                if(updatedIp){
                    return res.send(updatedIp);
                }
                return res.status(404).send('user not found with given ip!!');
            }
            return res.status(404).send('ip already assigned'); 
        }  
    }
    else{
        return res.status(404).send('user not found!!');
    }
});
//========================================================
app.listen(3000, ()=>{
    console.log(`listening on port: 3000`);
});