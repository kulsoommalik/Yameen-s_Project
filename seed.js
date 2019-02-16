const {ObjectID} = require('mongodb');
const {MAPPINGS_MODEL} = require('./models/MAPPINGS');
const {mongoose} = require('./mongoose');


const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const userThreeId = new ObjectID();
const userFourId = new ObjectID();

const users = [{
    username: 'user1',
    mainAccount: 'andrew@example.com',
    password: 'main_account pass',
    subAccount: 'acc1'
  }, {
    username: 'user2',
    mainAccount: 'andrew@example.com',
    password: 'main_account pass',
    subAccount: 'acc2'
  }, {
    username: 'user3',
    mainAccount: 'davidw@example.com',
    password: 'main_account pass',
    subAccount: 'acc1'
  }, {
    username: 'user4',
    mainAccount: 'davidw@example.com',
    password: 'main_account pass',
    subAccount: 'acc4'
  }];

    MAPPINGS_MODEL.remove({}).then(()=>{
        var userOne = new MAPPINGS_MODEL(users[0]).save();
        var userTwo = new MAPPINGS_MODEL(users[1]).save();
        var userThree = new MAPPINGS_MODEL(users[2]).save();
        var userFour = new MAPPINGS_MODEL(users[3]).save();
    });
    


  
