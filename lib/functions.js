const { transfer, redeem, contract, issue } = require('stas-js');
const {
    bitcoinToSatoshis,
    getTransaction,
    broadcast,
    getFundsFromFaucet
} = require('stas-js').utils;
const { bsv } = require('scryptlib');

async function token_by_address(network, address){
    let result = await fetch(`https://api.whatsonchain.com/v1/bsv/${network}/address/${address}/tokens/unspent`)
    result = await result.json();
    return result;
}

async function issue_func(network, reciever_address, issuer_private_key, amount, amount_to_send){
    const private_key = new bsv.PrivateKey.fromString(issuer_private_key)
    const contractUtxos = await getFundsFromFaucet(private_key.toAddress(network).toString())
    const fundingUtxos = await getFundsFromFaucet(private_key.toAddress(network).toString())
    const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(private_key.publicKey.toBuffer()).toString('hex')
    const supply = amount
    const symbol = 'AKR47'
    const schema = {
        name: 'Test Token',
        tokenId: `${publicKeyHash}`,
        protocolId: 'To be decided',
        symbol: symbol,
        description: 'Test-Token for STAS Experiment',
        image: 'https://www.taal.com/wp-content/themes/taal_v2/img/favicon/favicon-96x96.png',
        totalSupply: supply,
        decimals: 0,
        satsPerToken: 2,
        properties: {
          issuer: {
            organisation: 'Ayush',
            legalForm: 'NA',
            governingLaw: 'NA',
            mailingAddress: 'India',
            issuerCountry: 'India',
            jurisdiction: 'Global',
            email: 'NA'
          },
          meta: {
            schemaId: 'test-token-zf',
            website: '',
            legal: {
              terms: ''
            },
            media: [
              {
                URI: 'B://0ee1cfc3996e69a183e490e4d874f0bf8d646e9b9de74b168fbdf896012eadb1',
                type: 'image/png',
                altURI: '1kb.png'
              }
            ]
          }
        }
      }
      const contractHex = await contract(
        private_key,
        contractUtxos,
        fundingUtxos,
        private_key,
        schema,
        supply
      )
      const contractTxid = await broadcast(contractHex)
      console.log(`Contract TX: ${contractTxid}`)
      const contractTx = await getTransaction(contractTxid)
      
      const issueInfo = [
        {
          addr: reciever_address[0],
          satoshis: amount_to_send,
          data: 'one'
        },
        {
          addr: reciever_address[1],
          satoshis: amount - amount_to_send,
          data: 'two'
        }
      ]
      let issueHex
      try {
        issueHex = await issue(
          private_key,
          issueInfo,
          {
            txid: contractTxid,
            vout: 0,
            scriptPubKey: contractTx.vout[0].scriptPubKey.hex,
            satoshis: bitcoinToSatoshis(contractTx.vout[0].value)
          },
          {
            txid: contractTxid,
            vout: 1,
            scriptPubKey: contractTx.vout[1].scriptPubKey.hex,
            satoshis: bitcoinToSatoshis(contractTx.vout[1].value)
          },
          private_key,
          true, // isSplittable
          symbol
        )
      } catch (e) {
        console.log('error issuing token', e)
        return;
      }
    
    
    const issueTxid = await broadcast(issueHex)
    console.log(`Issue TX: ${issueTxid}`)
    const issueTx = await getTransaction(issueTxid)
    return "Contract & Issue Completed";
}

async function transfer_func(wif, txid, reciever_address, output_index, amount) {
    const sender_private_key = bsv.PrivateKey(wif);
    const issueTx = await getTransaction(txid);
    const transferhex = await transfer(
        sender_private_key,
        {
            txid: txid,
            vout: output_index,
            scriptPubKey: issueTx.vout[output_index].scriptPubKey.hex,
            satoshis: bitcoinToSatoshis(issueTx.vout[1].value)
        },
        reciever_address,
        null,
        null
    );
    const transfertxid = await broadcast(transferhex);
    return "lol";
}

async function redeem_func(wif, mergeSplitTxid, index, public_key){
    const mergeSplitTx = await getTransaction(mergeSplitTxid)
    var private_key = bsv.PrivateKey.fromWIF(wif);
    var public_key = bsv.PublicKey.fromString(public_key);
    const redeemHex = await redeem(
        private_key,
        public_key,
        {
            txid: mergeSplitTxid,
            vout: index,
            scriptPubKey: mergeSplitTx.vout[index].scriptPubKey.hex,
            satoshis: bitcoinToSatoshis(mergeSplitTx.vout[index].value)
        },
        null,
        null
    );
    const redeemTxid = await broadcast(redeemHex);
    return redeemTxid;
}

async function split_func(wif, transfer_txid, index, address, amount){
    const private_key = bsv.PrivateKey.fromWIF(wif);
    const transferTx = await getTransaction(transfer_txid)

    const amount_change = transferTx.vout[index].value - amount;
    const splitDestinations = []
    splitDestinations[0] = { address: bobAddr, satoshis: bitcoinToSatoshis(amount) }
    splitDestinations[1] = { address: bobAddr, satoshis: bitcoinToSatoshis(amount_change) }

    const splitHex = await split(
    private_key,
    {
        txid: transfer_txid,
        vout: index,
        scriptPubKey: transferTx.vout[index].scriptPubKey.hex,
        satoshis: bitcoinToSatoshis(transferTx.vout[index].value)
    },
    splitDestinations,
    null,
    null
    )
    const splitTxid = await broadcast(splitHex);
    return splitTxid;
}

module.exports = {
    transfer_func,
    redeem_func,
    token_by_address,
    split_func,
    issue_func
}