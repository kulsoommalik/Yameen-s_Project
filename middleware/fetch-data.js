
const {mongoose} = require('./../mongoose');
const {allCollectionNames} = require('./../collectionsDictionary');
const {USER_MODEL} = require('./../models/USER');

var print = console.log 

async function get_data_from_db (collectionName, inputQuery, expectedResponse){
    
    let modelName;
    print(allCollectionNames)
    let keys = Object.keys(allCollectionNames);
    for (key of keys) {                   //values of keys
        let val = allCollectionNames[key];
        if(val === collectionName){
            modelName = key;
        }
    }

    if(modelName === 'USER_MODEL'){
        var data = await USER_MODEL.find(inputQuery, expectedResponse);
        //console.log(data);
        return data
    }
};

async function main(){
//var allData = await get_data_from_db('my_users', {}, {});
console.log(allData);
}
main()
module.exports = {get_data_from_db};
