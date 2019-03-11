const jwt = require('jsonwebtoken');

const secret = "crm420";
function decodeToken (token) {
    let decoded; 
    try {
        decoded = jwt.verify(token, secret);  
        return Promise.resolve(decoded);         
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = {decodeToken};