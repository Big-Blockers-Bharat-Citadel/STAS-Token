let Mnemonic = require('bitcore-mnemonic');
const { bsv } = require('scryptlib');
const { MongoClient } = require('mongodb');
const prompt = require("prompt-sync")({sigint:true}); 
const fs = require('fs');
const { envs, total } = require('./config');
const mnemonic = new Mnemonic(envs);
const key = mnemonic.toHDPrivateKey();

function derive_child_keys(hdprivatekey) {
  let data = {};
  data.table = [];

  for(var i=1; i<=total; i++){
    hdprivatekey = hdprivatekey.deriveChild(`m/${i}`);
    let public_key = hdprivatekey.publicKey.toString();
    let private_key = hdprivatekey.privateKey.toString();
    let newPrivKey = new bsv.PrivateKey(private_key);
    let address = `${newPrivKey.toAddress()}`;
    let wif = `${newPrivKey.toWIF()}`;
    const obj = {
      public_key: public_key,
      private_key: private_key,
      address: address,
      wif: wif
    };
    data.table.push(obj);
  }

  fs.writeFile(
    "secrets.json",
    JSON.stringify(data, null, "\t"),
    "utf8",
    function (err) { if (err) throw err; }
  );
}

function balance_change(server){
  MongoClient.connect(server, { useNewUrlParser: true }, async function (err, client) { 
    if (err){
      console.log(`Cannot connect to ${server}`);
      throw err;
    }
    let db = client.db("balance_change");
    let len = await db.collection("balances").countDocuments();
    if(len == 0){
      db.collection("balances").insertOne({
        type: "previous",
        balance: 50
      });
      db.collection("balances").insertOne({
        type: "current",
        balance: 0
      });
      console.log("Data Successfully Added")
    }
    if(len == 2){
      let pre_balance = await db.collection("balances").findOne({"type": "previous"});
      let cur_balance = await db.collection("balances").findOne({"type": "current"});
      pre_balance = pre_balance.balance;
      cur_balance = cur_balance.balance;
      console.log(`${cur_balance - pre_balance} change in balance`);
    }
  });
}