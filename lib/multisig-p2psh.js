const bsv = require('bsv');

function create_multisig(){
  let pubkeys = [
    bsv.PrivateKey.fromRandom("testnet"),
    bsv.PrivateKey.fromRandom("testnet"),
    bsv.PrivateKey.fromRandom("testnet"),
    bsv.PrivateKey.fromRandom("testnet"),
  ];

  for(let i=0; i<pubkeys.length; i++){
    pubkeys[i] = pubkeys[i].publicKey;
    console.log(`${pubkeys[i].toString()} | ${pubkeys[i].toAddress().toString()}`);
  }

  const script = bsv.Script.buildMultisigOut(pubkeys, 3);
  const address = bsv.Address.payingTo(script);
  console.log(address.toString());
}

// Spending from the P2SH address
// const tx = new bsv.Transaction()
//   .from([{
//     txId: '<txid>',
//     outputIndex: 0,
//     script,
//     satoshis: 10000
//   }])
//   .to(address, 5000)
//   .change(address)
//   .sign(bsv.PrivateKey.fromWIF('<privateKey1>'))
//   .sign(bsv.PrivateKey.fromWIF('<privateKey2>'));
// console.log(tx.toString());
