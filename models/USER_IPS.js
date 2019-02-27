const mongoose = require('mongoose');

var UserIpSchema = mongoose.Schema({
   username: {
      type: String,
      required: true
   },
   ip: {
      type: String,
      required: true
   },
   enabled: {
      type: String,
      required: true
   }
});

let USER_IP_MODEL = mongoose.model('user_ips', UserIpSchema);
module.exports = {USER_IP_MODEL};