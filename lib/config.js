const dotenv = require('dotenv');
dotenv.config();
module.exports = { 
    envs: process.env.mnemonic,
    total: process.env.total
 };
