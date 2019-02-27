//expected response not working

const MongoClient = require('mongodb').MongoClient

var url = 'mongodb://localhost:27017/myApp';
async function getData(collectionName, inputQuery, expectedResponse){

    var myPromise = ()=>{
        return new Promise((resolve, reject)=>{
            MongoClient.connect(url, {useNewUrlParser: true}, async(err, client)=>{
                if(err){
                    console.log('Unable to connect mongoDB.');     
                }
                console.log('Connected to MongoDB');
                const db = client.db('myApp');
        
                db.collection(collectionName).find(inputQuery, expectedResponse).toArray(function(err, data) {
                    client.close();
                    if(err)
                        reject(err);
                    
                    resolve(data);
                    //console.log(data);     
                });
            });
        });
    }; 
    var callMyPromise = async () => {
        var res = await (myPromise());
        return res;
    };
    return await callMyPromise();
};

module.exports = {getData};