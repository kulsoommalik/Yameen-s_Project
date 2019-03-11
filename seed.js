const {mongoose} = require('./mongoose'); //connection 
const {STATS_MODEL} = require('./models/STATS');


const user_stats_array = [{
  username: 'user 1',
  date: Date.now(),
  totalCharges: '1',
  rate: '100',
  timeUsed: 10
}, {
  username: 'user 2',
  date: Date.now(),
  totalCharges: '2',
  rate: '110',
  timeUsed: 10
},{
  username: 'user 3',
  date: Date.now(),
  totalCharges: '33',
  rate: '200',
  timeUsed: 100
},{
  username: 'user 4',
  date: Date.now(),
  totalCharges: '4',
  rate: '101',
  timeUsed: 230
}, {
  username: 'user 5',
  date: Date.now(),
  totalCharges: '50',
  rate: '150',
  timeUsed: 50
}];

var user1 = new STATS_MODEL(user_stats_array[0]).save();
var user2 = new STATS_MODEL(user_stats_array[1]).save();
var user3 = new STATS_MODEL(user_stats_array[2]).save();
var user4 = new STATS_MODEL(user_stats_array[3]).save();
var user5 = new STATS_MODEL(user_stats_array[4]).save();


    // MAPPINGS_MODEL.remove({}).then(()=>{
    //     var userOne = new MAPPINGS_MODEL(users[0]).save();
    //     var userTwo = new MAPPINGS_MODEL(users[1]).save();
    //     var userThree = new MAPPINGS_MODEL(users[2]).save();
    //     var userFour = new MAPPINGS_MODEL(users[3]).save();
    // });


    


  
