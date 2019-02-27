//const {mongoose} = require('./../mongoose');
const mongoose = require('mongoose');
const multer = require('multer');
const gridFsStrorage = require('multer-gridfs-storage');
const grid = require('gridfs-stream');
const methodOverride = require('method-override');
//const crypto = require('crypto');

function uploadFile(name, filepath){

    const mongoURI = 'mongodb://localhost:27017/myApp';
    //mongo connection
    const conn = mongoose.createConnection(mongoURI,{useNewUrlParser: true});
    //init gfs
    let gfs;
    conn.once('open', ()=>{
        //init stream
        gfs = grid(conn.db, mongoose.mongo);
        gfs.collection('rate_list');
    });
    //create storage engine
    let storage = new gridFsStrorage({
        url: mongoURI,
        file: filepath
    });
    const upload = multer({ storage });
    upload.single(name);
    //console.log('uploaded');
};

module.exports = {uploadFile};