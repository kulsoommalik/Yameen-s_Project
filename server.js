const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const csv = require('fast-csv');
const multer = require('multer');
const path = require('path');
const fileUpload = require('express-fileupload');
var mime = require('mime-to-extensions');

const { mongoose } = require('./mongoose');

const { USER_MODEL } = require('./models/USER');
const { ADMIN_MODEL } = require('./models/ADMIN');
const { MAIN_ACC_MODEL } = require('./models/MAIN_ACC');
const { RATE_LIST_MODEL } = require('./models/RATE_LIST');
const { STATS_MODEL } = require('./models/STATS');
const { MAPPINGS_MODEL } = require('./models/MAPPINGS');
const { USER_IP_MODEL } = require('./models/USER_IPS');

const { sendEmail } = require('./functions/send-email');
const { getData } = require('./functions/get-data');
const { getSubAccounts } = require('./functions/get-unassigned-subAccounts');
const { authenticateUser, authenticateAdmin } = require('./functions/authenticate');
const { decodeToken } = require('./functions/decodeToken');

require('./seed');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",
        "Origin , X-Requested-With , Content-Type , Accept , Authorization, x-auth"
    );
    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", 'PUT , POST , PATCH , DELETE , GET');
        return res.status(200).json({});
    }
    next();
});

app.use(fileUpload());
app.use(express.static('uploads'));

//1 === user Signup
app.post('/signup', (req, res) => {
    console.log('pass');
    if (req.body.password !== req.body.retypePassword) {
        return res.status(404).send('Passwords does not match');
    }
    console.log('pass1', req.body);

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
    user.save().then((doc) => {
        console.log(typeof (doc));


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

        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((e) => {
        res.status(404).send('error');
    })

});

//2 === user/admin login -> req: username/email, password
app.get('/login', (req, res) => {

    if (req.body.hasOwnProperty('email')) {
        ADMIN_MODEL.findByCredentials(req.body.email, req.body.password).then(async (admin) => {
            //deleting all previous tokens from db            
            let afterDeleted = await ADMIN_MODEL.findOneAndUpdate({ email: admin.email }, { $set: { tokens: [] } }, { new: true });

            return afterDeleted.generateAuthToken().then((token) => { //generating auth-token and saving in db
                res.header('x-auth', token).send({
                    email: afterDeleted.email,
                    _id: afterDeleted._id,
                    token: afterDeleted.tokens[0].token,
                    role: afterDeleted.role
                });
            });
        }).catch((e) => {
            res.status(404).send(e);
        });
    }
    else if (req.body.hasOwnProperty('username')) {
        USER_MODEL.findByCredentials(req.body.username, req.body.password).then(async (user) => {

            let afterDeleted = await USER_MODEL.findOneAndUpdate({ username: user.username }, { $set: { tokens: [] } }, { new: true });

            return afterDeleted.generateAuthToken().then((token) => {
                res.header('x-auth', token).send({
                    username: afterDeleted.username,
                    _id: afterDeleted._id,
                    token: afterDeleted.tokens[0].token,
                    role: afterDeleted.role
                });
            });
        }).catch((e) => {
            res.status(404).send(e);
        });
    }
});

//3 === FOR ADMIN -> Get user profile -> req: username, show all fields
app.get('/get-user-profile-admin/:username', authenticateAdmin, (req, res) => {

    USER_MODEL.find({ username: req.params.username }).then((user_data) => {
        res.send(user_data);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

//4 === FOR USER -> get user profile
app.get('/get-user-profile-user', authenticateUser, (req, res) => {

    let userName;
    decodeToken(req.header('x-auth')).then((decodedData) => {
        userName = decodedData.username;

        USER_MODEL.find({ username: userName }).then((user_data) => {
            res.send(user_data);
        }).catch((e) => {
            res.status(400).send(e);
        });

    }).catch((e) => {
        return res.status(404).send('Invalid auth-token');
    });
});

//5 === Get all users -> nothing given , show few fields
app.get('/get-all-users', authenticateAdmin, (req, res) => {

    USER_MODEL.find({}, { username: 1, password: 1, status: 1 }).then((user_data) => {
        res.send(user_data);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

//6 === Seding confirmation email to user and updating status -> req: username
app.post('/confirm-email', (req, res) => {

    USER_MODEL.find({ username: req.body.username }, { noticeEmail: 1 }).then((data) => {
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
        USER_MODEL.findOneAndUpdate({ username: req.body.username }, { $set: { status: 'ENABLED' } }, { new: true }).then(() => {
            console.log('status changed!!');
        });

        res.send('Email sent');
    }).catch((e) => {
        res.status(400).send(e);
    });
});

//7 === FOR USER -> updating user fields -> req: updated fields
app.post('/update-user-USER', authenticateUser, (req, res) => {
    let userName;
    decodeToken(req.header('x-auth')).then((decodedData) => {
        userName = decodedData.username;

        if (!req.body.hasOwnProperty('role') && !req.body.hasOwnProperty('status') && !req.body.hasOwnProperty('balance')
            && !req.body.hasOwnProperty('rate') && !req.body.hasOwnProperty('suspendLimit') && !req.body.hasOwnProperty('blockIP')
            && !req.body.hasOwnProperty('rate')) {
            return res.status(404).send('Trying to update unaccessable fields')
        } else {
            USER_MODEL.findOneAndUpdate({ username: userName }, { $set: req.body }, { new: true }).then((data) => {
                let myObj = req.body;
                //seding email when other fields changed
                if (Object.keys(req.body).length > 0) {
                    console.log(typeof (req.body));

                    sendEmail({
                        user: 'kikis.art22@gmail.com',
                        pass: '<Karachi90!!1/>'
                    }, {
                            from: '"Kikis art" kikis.art22@gmail.com',
                            to: data.noticeEmail,
                            subject: 'Fields Changed',
                            text: `fields has been changed!!! ${JSON.stringify(myObj)}`
                        });
                }
                return res.send({ status: 'updated', Data: data });

            }).catch((e) => {
                return res.status(404).send(e);
            });
        }
    }).catch((e) => {
        return res.status(404).send('Invalid auth-token');
    });
});
//7.1 === FOR ADMIN -> req: username and fields to be changed
app.post('/update-user-ADMIN', authenticateAdmin, (req, res) => {

    USER_MODEL.findOneAndUpdate({ username: req.body.username }, { $set: req.body }, { new: true }).then((data) => {

        if (req.body.hasOwnProperty('balance')) {
            //finding previous balance to send in email
            let previousBalance;
            USER_MODEL.find({ username: req.body.username }, { balance: 1 }).then((bal) => {
                previousBalance = bal[0].balance;
            }).catch((e) => {
                return res.status(404).send(e);
            });
            //---------Sending email----------------------
            sendEmail({
                user: 'kikis.art22@gmail.com',
                pass: '<Karachi90!!1/>'
            }, {
                    from: '"Kikis art" kikis.art22@gmail.com',
                    to: data.balanceEmail,
                    subject: 'Balance Changed',
                    text: `your balance has been changed from ${previousBalance} to ${req.body.balance}`
                });
            //--------------------------------------------

            if (data.balance > 0) {
                USER_MODEL.findOneAndUpdate({ username: req.body.username }, { $set: { blockIP: false } }).exec();
            } else if (data.balance <= 0) {
                USER_MODEL.findOneAndUpdate({ username: req.body.username }, { $set: { blockIP: true } }).exec();
            }
            delete req.body.balance;
        }
        if (req.body.hasOwnProperty('rate')) {
            //finding previous rate to send in email
            let previousRate;
            USER_MODEL.find({ username: req.body.username }, { rate: 1 }).then((bal) => {
                previousRate = bal[0].rate;
            }).catch((e) => {
                return res.status(404).send(e);
            });
            //-------Sending email if rate changed ----------
            sendEmail({
                user: 'kikis.art22@gmail.com',
                pass: '<Karachi90!!1/>'
            }, {
                    from: '"Kikis art" kikis.art22@gmail.com',
                    to: data.rateEmail,
                    subject: 'Rate Changed',
                    text: `your rate has been changed from ${previousRate} to ${req.body.rate}`
                });
            //-----------------------------------------------
            delete req.body.rate;
        }
        let myObj = req.body;
        console.log(typeof (myObj));

        //seding email when other fields changed
        if (Object.keys(req.body).length > 0) {
            console.log(typeof (req.body));

            sendEmail({
                user: 'kikis.art22@gmail.com',
                pass: '<Karachi90!!1/>'
            }, {
                    from: '"Kikis art" kikis.art22@gmail.com',
                    to: data.noticeEmail,
                    subject: 'Fields Changed',
                    text: `fields has been changed!!! ${JSON.stringify(myObj)}`
                });
        }
        return res.send({ data });

    }).catch((e) => {
        return res.status(404).send();
    });
});

//8 === admin signup -> req: email, pass
app.post('/admin-signup', (req, res) => {

    let admin = new ADMIN_MODEL({
        email: req.body.email,
        password: req.body.password
    });
    admin.save().then(() => {
        return admin.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(admin);
    }).catch((e) => {
        res.status(404).send(e);
    })
});

//9 ===  any admin can add subaccount in any main account -> req: mainAcc, subaccount name
app.post('/add-sub-account', authenticateAdmin, (req, res) => {

    let isPresent = false;
    //checking if subAccount is unique
    MAIN_ACC_MODEL.findOne({ email: req.body.mainAccount }, { subAccount: 1 }).then(async (data) => {

        for (var i = 0; i < data.subAccount.length; i++) {
            if (req.body.subAccount === data.subAccount[i]) {
                isPresent = true;
                break;
            }
        }

        if (!isPresent) {
            MAIN_ACC_MODEL.findOneAndUpdate({ email: req.body.mainAccount }, { $push: { subAccount: req.body.subAccount } }, { new: true }).then((doc) => {
                return res.send(doc.subAccount);
            }).catch((e) => {
                return res.status(404).send(e);
            });
        } else {
            return res.status(404).send('subAccount alreay exist');
        }
    }).catch((e) => {
        return res.status(404).send('main account not found!!!');
    });
});

//10 === Removing sub account -> req: email(of mainAcc), subaccount name
app.post('/remove-sub-account', authenticateAdmin, (req, res) => {

    // ---- subaccount not found error not handled ----
    MAIN_ACC_MODEL.findOneAndUpdate({ email: req.body.email }, { $pull: { subAccount: req.body.subAccount } }, { new: true }).then((data) => {
        if (!data) {
            return res.status(404).send('main account not found!')
        }
        return res.send(data);
    }).catch((e) => {
        res.status(404).send(e);
    });
});

//11 === Add mainACC -> req: email, pass
app.post('/add-main-account', authenticateAdmin, (req, res) => {

    let ma = new MAIN_ACC_MODEL({
        email: req.body.email,
        password: req.body.password
    });
    ma.save().then((data) => {
        return res.send(data);
    }).catch((e) => {
        return res.status(404).send(e);
    });

});

//12 === Remove mainACC -> req: email(of mainAcc)
app.post('/remove-main-account', authenticateAdmin, (req, res) => {

    MAIN_ACC_MODEL.findOneAndRemove({ email: req.body.email }).then((data) => {
        if (!data) {
            return res.status(404).send('main account not found');
        }
        return res.send({ status: 'removed', mainAccount: data.email });
    }).catch((e) => {
        return res.status(404).send(e);
    });
});

//13 === update main-account password -> req: email(of mainAcc), newPass
app.post('/update-mainAccount-pass', (req, res) => {

    if (req.body.newPassword !== req.body.retypePassword) {
        return res.status(404).send('Password not matched');
    }
    var hashPwd = null;
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.newPassword, salt, (err, hash) => {
            if (err) {
                return null;
            }
            hashPwd = hash;
            MAIN_ACC_MODEL.findOneAndUpdate({ email: req.body.email }, { $set: { password: hashPwd } }, { new: true }).then((updatedData) => {
                return res.send({ status: 'Updated', updatedData });
            }).catch((e) => {
                return res.status(404).send(e);
            });
        });
    });
});

//14 === Show all main accounts
app.get('/get-all-main-accounts', authenticateAdmin, async (req, res) => {

    return res.send(await getData('main_accounts', {}, {}));
});

//15 === Show stats of specific user -> req: username
app.get('/get-stats', async (req, res) => {

    return res.send(await getData('stats', { username: req.body.username }, {}));
});

//16 === Forgot password -> req: newPassword, retypePassword, username/email
app.post('/forgot-password', async (req, res) => {

    if (req.body.newPassword !== req.body.retypePassword) {
        return res.status(404).send('Passwords not matched');
    }
    //hashing password
    var myPromise = () => {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(req.body.newPassword, salt, (err, hash) => {
                    if (err)
                        reject(err);

                    resolve(hash);
                });
            });
        });
    };
    var callMyPromise = async () => {
        var res = await (myPromise());
        return res;
    }
    var hashedPass = await callMyPromise();
    //--- hashing end ---

    if (req.body.hasOwnProperty('username')) {
        USER_MODEL.findOneAndUpdate({ username: req.body.username }, { $set: { password: hashedPass } }, { new: true })
            .then(data => {
                if (data) {
                    return res.send(data);
                }
                return res.status(404).send('username not found');
            }).catch(e => {
                return res.status(404).send(e);
            });
    }
    if (req.body.hasOwnProperty('email')) {
        ADMIN_MODEL.findOneAndUpdate({ email: req.body.email }, { $set: { password: hashedPass } }, { new: true })
            .then(data => {
                if (data) {
                    return res.send(data);
                }
                return res.status(404).send('email not found');
            }).catch(e => {
                return res.status(404).send(e);
            });
    }
});
//17 === Map user -> req: username(of user), mainAccount(email), subAccount
app.post('/map-user', authenticateAdmin, (req, res) => {

    //user exists in USER_MODEL
    USER_MODEL.find({ username: req.body.username }).then((d) => {

        if (d.length !== 0) { //user found
            MAPPINGS_MODEL.find({ username: req.body.username }).then((d) => {

                if (d.length === 0) { //user not mapped
                    //if password is found that means mainAccount exists
                    MAIN_ACC_MODEL.findOne({ email: req.body.mainAccount }, { password: 1, subAccount: 1, _id: 0 }).then(async (data) => {
                        //check if subAccount is valid and subAccount is not already assigned
                        let sub = new Array();
                        sub = await getSubAccounts(req.body.mainAccount); //getting unassigned sub accounts

                        if (sub.includes(req.body.subAccount)) { // if subAccount is from unassigned subaccounts  
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

                    }).catch(e => {
                        return res.status(404).send('main-account not found!!!');
                    });
                } else {
                    return res.status(404).send('User already mapped!!');
                }

            }).catch((e) => {
                res.status(404).send(e);
            });
        } else {
            return res.status(404).send('username does not exist!!');
        }

    }).catch((e) => {
        return res.status(404).send(e);
    });

});

//18 === get unassigned sub-accounts -> req: mainAccount //gives available subaccounts of given email
app.get('/get-unassigned-subAccounts/:email', authenticateAdmin, (req, res) => {

    getSubAccounts(req.params.email).then((Data) => {
        return res.send(Data);
    }).catch((e) => {
        return res.status(404).send(e);
    });
});

//19 === get all sub accounts correspond to email -> params: email
app.get('/get-allSubAccounts-email/:email', authenticateAdmin, async (req, res) => {
    var data = await getData('main_accounts', { email: req.params.email }, {});
    return res.send(data[0].subAccount);
});

//20 === return users that are not mapped
app.get('/get-unMapped-users', authenticateAdmin, (req, res) => {

    USER_MODEL.find({}, { username: 1, _id: 0 }).then((users) => {
        MAPPINGS_MODEL.find({}, { username: 1, _id: 0 }).then(async (mappedUsers) => {

            mappedUsers.forEach((item, index, array) => {
                users.forEach((item1, index1, array1) => {
                    if (item.username == item1.username) {
                        users.splice(index1, 1);
                    }
                })
            });
            return res.send(users);

        }).catch((e) => {
            return res.status(404).send(e);
        })

    }).catch((e) => {
        return res.status(404).send(e);
    });

});

//20.1 === get main-accounts having unassigned sub-accounts
app.get('/get-mainAccounts-with-subAccounts', (req, res) => {

    MAIN_ACC_MODEL.find({}, { email: 1, _id: 0 }).then(async (allEmails) => {
        //console.log('allEmails', allEmails);  //all emails of admins

        var allSubAccounts = new Array();
        var adminsHaveSubAccounts = new Array(); //admins means main_accs

        for (var i = 0; i < allEmails.length; i++) {
            allSubAccounts[i] = await getSubAccounts(allEmails[i].email); //getting unAssigned subAccounts of one ith email
            if (allSubAccounts[i].length !== 0) {
                adminsHaveSubAccounts[i] = allEmails[i];
            }
        }
        return res.send(adminsHaveSubAccounts);

    }).catch((e) => {
        return res.status(404).send();
    });
});

//21 === get all Mappings
app.get('/get-all-mappings', authenticateAdmin, async (req, res) => {
    res.send(await getData('mappings', {}, {}));
});

//22 === change mappings account -> req: username , main acc, sub acc
app.post('/update-mappings-account', authenticateAdmin, (req, res) => {

    MAPPINGS_MODEL.findOne({ username: req.body.username }).then((d) => {
        if (d != null) { //user found
            MAIN_ACC_MODEL.findOne({ email: req.body.mainAccount }).then((main_acc) => {

                if (main_acc != null) { //main_account found
                    getSubAccounts(req.body.mainAccount).then((sub_accs) => { //getting un assigned sub accounts

                        if (sub_accs.includes(req.body.subAccount)) { //sub acc exist in sub_accs                                            
                            MAPPINGS_MODEL.findOneAndUpdate({ username: req.body.username }, { $set: { mainAccount: req.body.mainAccount, subAccount: req.body.subAccount, password: main_acc.password } }, { new: true }).then((updatedData) => {
                                return res.send({ status: 'Updated', updatedData });
                            }).catch((e) => {
                                return res.status(404).send(e);
                            });
                        } else {
                            return res.status(404).send('sub account not available or invalid'); //sub acc is either not in available subAccs or invalid
                        }

                    }).catch((e) => {
                        return res.status(404).send(e);
                    });
                }
                else {
                    return res.status(404).send('Main account does not exist');
                }
            }).catch((e) => {
                return res.status(404).send(e);
            });
        }
        else {
            return res.status(404).send('User not found in mappings');
        }
    }).catch((e) => {
        return res.status(404).send(e);
    });
});

//23 === Remove mapping -> params: username
app.delete('/remove-mapping/:username', (req, res) => {

    MAPPINGS_MODEL.find({ username: req.params.username }).then((d) => {
        if (d.length !== 0) {
            MAPPINGS_MODEL.find({ username: req.params.username }).remove().exec();
            return res.send({ response: 'User removed!!' });
        } else {
            return res.status(404).send('User not found')
        }
    }).catch((e) => {
        return res.status(404).send(e);
    });
});

//24 === adding/updating ip -> req: username, prevIp, newIp, enabled
app.post('/add-update-ip', authenticateUser, async (req, res) => {

    let userName;
    decodeToken(req.header('x-auth')).then(async (decodedData) => {
        userName = decodedData.username;
        //check ip does not exist already for the username provided
        let userIps = await USER_IP_MODEL.find({ username: userName }, { ip: 1, _id: 0 });

        function checkIps() {
            return userIps.some(function (element) {
                return element.ip === req.body.newIp;
            });
        };

        //*. check if user exists in USER_MODEL
        let user = await USER_MODEL.findOne({ username: userName });
        if (user) {
            if ((req.body.prevIp == null || req.body.prevIp == '') && req.body.newIp != null) { // --case Add-- -> add new user ip                        
                if (!checkIps()) { //if ip already doesnot exists                
                    var user_ip = new USER_IP_MODEL({
                        username: userName,
                        ip: req.body.newIp,
                        enabled: req.body.enabled
                    });
                    let savedData = await user_ip.save();
                    return res.send({ status: 'ip added', Data: savedData });
                }
                return res.status(404).send('ip already assigned');
            } else if (req.body.prevIp == req.body.newIp) { // ---case Update--- -> 1. update only status            
                let updatedStatus = await USER_IP_MODEL.findOneAndUpdate({ username: userName, ip: req.body.prevIp }, { $set: { enabled: req.body.enabled } }, { new: true });
                if (updatedStatus) {
                    return res.send({ status: 'Enabled updated', Data: updatedStatus });
                }
                return res.status(404).send('user not found with given ip!!');
            } else if ((req.body.prevIp != null || req.body.prevIp != '') && req.body.prevIp != req.body.newIp) { // ---case update-- -> 2. updating ip
                var userStatus = await USER_IP_MODEL.findOne({ username: userName, ip: req.body.prevIp }, { enabled: 1, _id: 0 });
                console.log('stats:', userStatus.enabled);
                console.log('enabled: ', req.body.enabled);

                if (!checkIps() && (req.body.enabled == userStatus.enabled)) { //updating only ip
                    let updatedIp = await USER_IP_MODEL.findOneAndUpdate({ username: userName, ip: req.body.prevIp }, { $set: { ip: req.body.newIp } }, { new: true });
                    if (updatedIp) {
                        return res.send({ status: 'ip updated', Data: updatedIp });
                    }
                    return res.status(404).send('user not found with given ip!!');
                } else if (!checkIps() && (req.body.enabled != userStatus.enabled)) { //updating ip + enabled
                    let updatedIp = await USER_IP_MODEL.findOneAndUpdate({ username: userName, ip: req.body.prevIp }, { $set: { ip: req.body.newIp, enabled: req.body.enabled } }, { new: true });
                    if (updatedIp) {
                        return res.send({ status: 'ip and enabled updated', Data: updatedIp });
                    }
                    return res.status(404).send('user not found with given ip!!');
                }
                return res.status(404).send('ip already assigned');
            }
        } else {
            return res.status(404).send('user not found!!');
        }

    }).catch((e) => {
        return res.status(404).send('Invalid auth-token');
    });
});

//24.1 === delete user ip -> params: ip ID
app.delete('/remove-ip/:id', authenticateUser, (req, res) => {

    decodeToken(req.header('x-auth')).then(async (decoded) => {
        let userName = decoded.username;

        USER_IP_MODEL.findOneAndDelete({ username: userName, _id: req.params.id }).then((data) => {
            return res.send(`Removed ip: ${req.params.id}`);
        }).catch((e) => {
            return res.status(404).send(e);
        });

    }).catch((e) => {
        return res.status(404).send('Invalid auth-token');
    });
});

//25 === ADMIN -- getting all ips of user -> args: username
app.get('/get-user-ips/:username', authenticateAdmin, async (req, res) => { //Shahvaiz Username to param
    return res.send(await getData('user_ips', { username: req.params.username }, {}));
});

//26 === USER -- getting all ips of user
app.get('/get-user-ips', authenticateUser, (req, res) => { //Shahvaiz userName to jwtDecode

    let userName;
    decodeToken(req.header('x-auth')).then(async (decodedData) => { //decoding username from auth token
        userName = decodedData.username;
        data = await getData('user_ips', { username: userName }, {});
        return res.send(data);
    }).catch((e) => {
        return res.status(404).send('Invalid auth-token');
    });
});

//27 === getting all ips of all users -> args: username
app.get('/get-all-users-ips', authenticateAdmin, async (req, res) => {
    return res.send(await getData('user_ips', {}, {}));
});

//28 === uploading csv/pdf file -> req: file, filename
app.post('/upload-file', (req, res) => {

    //---- checking if filename is unique or not ----
    RATE_LIST_MODEL.findOne({ filename: req.body.filename }).then((rates) => {
        if(rates){        
            return res.status(404).send({
                status: false,
                error: 'File with this name already exists'
            });
        }else{

            let sampleFile = req.files.file;
            if (mime.extension(sampleFile.mimetype) !== 'csv' && mime.extension(sampleFile.mimetype) !== 'xls') {
                return res.status(404).send({
                    error: 'Invalid file type',
                    status: false
                });
            } else {                
                // Use the mv() method to place the file somewhere on your server
                sampleFile.mv('./uploads/' + req.body.filename + '.' + mime.extension(sampleFile.mimetype), async function (err) {
                    if (err){                        
                        return res.status(500).send(err.message);
                    }
                    var downloadableUrl = req.body.filename + '.' + mime.extension(sampleFile.mimetype);
                    var rateList = new RATE_LIST_MODEL({
                        filename: req.body.filename,
                        filePath: downloadableUrl
                    });
                    var response = await rateList.save();
        
                    return res.status(200).json({
                        message: 'File upload successfull!',
                        status: true
                    });
                });
            }        
        }
    }).catch((e) => {
        return res.status(404).send(e);
    });
});

//29 === show all rate list files
app.get('/show-rate-list', async (req, res) => {
    return res.send(await getData('rate_lists', {}, {}));
});

//========================================================
app.listen(3000, () => {
    console.log(`listening on port: 3000`);
});