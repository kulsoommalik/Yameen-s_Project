const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const busboyBodyParser = require('busboy-body-parser');
const fs = require('fs');
const csv = require('fast-csv');
const multer = require('multer');

const {mongoose} = require('./mongoose');
const {USER_MODEL} = require('./models/USER');
const {ADMIN_MODEL} = require('./models/ADMINS');
const {RATE_LIST_MODEL} = require('./models/RATE_LIST');
const {STATS_MODEL} = require('./models/STATS');

//const {get_data_from_db} = require('./middleware/fetch-data');
const {sendEmail} = require('./middleware/send-email');
const {uploadFile} = require('./middleware/upload-file');
const {getData} = require('./middleware/get-data');


const upload = multer({ dest: 'tmp/csv/' });    //folder for temp files
const app = express();
app.use(bodyParser.urlencoded({extended:true}));

//1 === user Signup
app.post('/signup', (req, res)=>{

    if(req.body.password !== req.body.retypePassword){
        return res.status(404).send('Passwords not matched');
    }
    var user = new USER_MODEL({
        status: 'DISABLED',
        balance: 0,
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
        res.send({status: saved, data: doc});

        //sendind email to admin work
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

//2 === user login -> req: username, password
app.get('/login', (req, res)=>{
    
    USER_MODEL.find({username: req.body.username},{password:1}).then((data)=>{

        let hashedPassword = data[0].password;
        // console.log('data: ', data);
        // console.log('hashed pass: ', hashedPassword);
        // console.log('pass: ', req.body.password);

        bcrypt.compare(req.body.password, hashedPassword).then((result)=>{
            if(result){
                res.send('login');
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

    let previousBalance;
    USER_MODEL.find({username: req.body.username}, {balance:1}).then((bal)=>{
        previousBalance = bal[0].balance;
    }).catch((e)=>{
        console.log(e);
    });

    USER_MODEL.findOneAndUpdate({username: req.body.username}, {$set: req.body}, {new: true}).then((data)=>{
        //sending email if balance changed
        let keys = Object.keys(req.body);
        let flag = false;
        for(var i=0; i<keys.length; i++){
            if(keys[i] == 'balance'){
                flag = true;
            }
        }
        if(flag){
            sendEmail({
                user: 'kikis.art22@gmail.com',
                pass: '<Karachi90!!1/>'
            }, {
                from: '"Kikis art" kikis.art22@gmail.com',
                to: data.balanceEmail,
                subject: 'Balance Changed',
                text: `hey !! ${req.body.username} your balance has been changed from ${previousBalance} to ${req.body.balance}`
            });
            delete req.body.balance;
        }
        //seding email when other fields changed
        let reqString = req.body.toString();
        sendEmail({
            user: 'kikis.art22@gmail.com',
            pass: '<Karachi90!!1/>'
        }, {
            from: '"Kikis art" kikis.art22@gmail.com',
            to: data.noticeEmail,
            subject: 'Fields Changed',
            text: `hey !! ${req.body.username} following fields has been changed!!! ${reqString}`
        });

        res.send({data});

    }).catch((e)=>{
        res.status(404).send();
    });
});

//7 === uploading csv/pdf file -> req: filename, filepath
app.post('/upload-file', upload.single('file') ,(req, res)=>{

    const fileRows = [];
    // open uploaded file
    csv.fromPath(req.file.path).on("data", (data)=>{
        fileRows.push(data); // push each row
    }).on("end",()=>{
        console.log(fileRows)
        fs.unlinkSync(req.file.path);   // remove temp file
        //process "fileRows" and respond
        res.send(fileRows);
    });
});
app.use('/upload-csv', this.app);

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
    ADMIN_MODEL.findOne({email: req.body.email}, {subAccount: 1}).then((data)=>{
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
app.get('/get-main-accounts', (req, res)=>{
    
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

//14 === Forgot password 
app.post('/forgot-password', (req, res)=>{

    if(req.body.newPassword === req.body.retypePassword){
        return res.status(404).send('Passwords not matched');
    }
    
    if(req.body.collectionName === "user_account"){
        USER_MODEL.findOneAndUpdate({username: req.body.username}, {$pull: {password: }})
    }

})

//========================================================
app.listen(3000, ()=>{
    console.log(`listening on port: 3000`);
});