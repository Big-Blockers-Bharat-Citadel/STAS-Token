const express = require('express');
const cors = require("cors");
const app = express();
const { token_by_address, transfer_func, redeem_func, split_func, issue_func } = require('./functions');
app.use(express.json())

app.use(cors());
app.get("/",(req,res)=> { res.send("server is running") })

app.post("/address", async (req, res) => {
    var address = req.body.address;
    var network = req.body.network;
    const result = await token_by_address(network, address);
    res.send(result);
})

app.post("/issue", async (req, res) => {
    var network = req.body.network;
    var reciever_address = req.body.reciever_address;
    var issuer_private_key = req.body.key;
    var amount = req.body.amount;
    var amount_to_send = req.body.amount_to_send;
    const result = await issue_func(network, reciever_address, issuer_private_key, amount, amount_to_send);
    res.send(result)
})

app.post("/transfer", async (req, res) => {
    var wif = req.body.wif;
    var txid = req.body.txid;
    var reciever_address = req.body.address;
    var amount = req.body.amount;
    var output_index = req.body.output_index;
    const result = await transfer_func(wif, txid, reciever_address, output_index, amount);
    res.send(`Transfer Tx :- ${result}`);
})

app.post("/redeem", async (req, res) => {
    var wif = req.body.wif;
    var txid = req.body.txid;
    var index = req.body.index;
    var public = req.body.publickey;
    const result = await redeem_func(wif, txid, index, public);
    res.send(`Redeem Tx :- ${result}`);
})

app.post("/split", async (req, res) => {
    var wif = req.body.wif;
    var txid = req.body.txid;
    var index = req.body.index;
    var address = req.body.address;
    var amount = req.body.amount;
    const result = await split_func(wif, txid, index, address, amount);
    res.send(`Split Tx :- ${result}`);
})

app.listen(3000);