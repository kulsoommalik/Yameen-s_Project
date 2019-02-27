const {mongoose} = require('./../mongoose');
const {ADMIN_MODEL} = require('./../models/ADMINS');
const {MAPPINGS_MODEL} = require('./../models/MAPPINGS');

async function getSubAccounts(adminEmail){

    let myPromise = ()=>{
        return new Promise((resolve, reject)=>{
            ADMIN_MODEL.find({email: adminEmail},{subAccount:1, _id:0}).then((data)=>{
                //console.log('data: ',data); //all sub accounts of given main account
                
                MAPPINGS_MODEL.find({mainAccount: adminEmail}, {subAccount:1, _id:0}).then((result)=>{
                    let list = data[0].subAccount;
                    for(let i=0; i<result.length; i++){
                        list.splice( list.indexOf(result[i].subAccount), 1 );
                    }
                    //console.log('unAssigned sub accounts: ',list);
                    resolve(list);
                }).catch(e=>{
                    reject(e);
                });
            }).catch(e=>{
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