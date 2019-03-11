const {mongoose} = require('./../mongoose');
const {MAIN_ACC_MODEL} = require('../models/MAIN_ACC');
const {MAPPINGS_MODEL} = require('./../models/MAPPINGS');

async function getSubAccounts(mainAccountEmail){

    let myPromise = ()=>{
        return new Promise((resolve, reject)=>{
            MAIN_ACC_MODEL.findOne({email: mainAccountEmail},{subAccount:1, _id:0}).then((data)=>{
                
                if(data.subAccount.length == 0){
                    resolve(data.subAccount);
                }
                else if(data != null && data.subAccount.length > 0){
                    //console.log('data: ',data); //all sub accounts of given main account
                    MAPPINGS_MODEL.find({mainAccount: mainAccountEmail}).then((result)=>{
                        //console.log(result);
                                            
                        let list = data.subAccount; //list of all subAccounts
                        for(let i=0; i<result.length; i++){
                            list.splice( list.indexOf(result[i].subAccount), 1 );
                        }
                        //console.log('unAssigned sub accounts: ',list);
                        resolve(list);
            
                    }).catch( e => {
                        reject(e);
                    });    
                }
                else{
                    reject('Email not found in main accounts');
                }
            }).catch( e => {
                reject(e);
            });
        });
    };

    var callMyPromise = async () => {
        var res = await (myPromise());
        return res;
    };
    return await callMyPromise();
};
module.exports = {getSubAccounts};