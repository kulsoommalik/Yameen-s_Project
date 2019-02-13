var nodemailer = require('nodemailer');

//mailer is person who is sending = {user, pass}, mailObject={from: , to: , subject: , text: }
function sendEmail (mailer, mailObject) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,    
        service: 'gmail',
        secure: false,
        auth: {
          user: mailer.user,
          pass: mailer.pass
        },
        tls: {
            rejectUnauthorized: false
        }
      });
      
      let mailOptions = mailObject;
      
      transporter.sendMail(mailOptions, (error, info)=>{
        if (error) {
          return console.log(error);
        } else {
          return console.log('Email sent: ' + info);
        }
      });
}

module.exports = {sendEmail};

// sendEmail({
//     user: 'kikis.art22@gmail.com',
//     pass: '<Karachi90!!1/>'
// }, {
//     from: '"Kikis art" kikis.art22@gmail.com',
//     to: 'm.kulsoom22@gmail.com',
//     subject: 'node mailer',
//     text: 'it worked!!'
// });