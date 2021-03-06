let wizard = require('wizard_nodejs');
let level = require('level');
let env = require('./env');
let axios = require('axios');

let db = level('./db', { valueEncoding: 'json' });
let InfinitechainBuilder = wizard.InfinitechainBuilder;
let Receipt = wizard.Receipt;
// let Types = wizard.Types;
let url = 'http://localhost:3001/pay';
let assetAddress = env.assetAddress;

let infinitechain = new InfinitechainBuilder()
  .setNodeUrl(env.nodeUrl)
  .setWeb3Url(env.web3Url)
  .setSignerKey(env.signerKey)
  .setStorage('level', db)
  .build();

infinitechain.initialize().then(async () => {
  // onInstantWithdrawa
  infinitechain.event.onInstantWithdraw((err, result) => {
    console.log('instantWithdraw:');
    console.log(result);
  });

  // instantWithdraw
  let withdrawalLightTx = await infinitechain.client.makeProposeWithdrawal(
    { assetID: assetAddress.padStart(64, '0'),
      value: 1
    }
  );
  
  let response = await axios.post(url, withdrawalLightTx.toJson());
  let withdrawalReceiptJson = response.data;

  let withdrawalReceipt = new Receipt(withdrawalReceiptJson);
  await infinitechain.client.saveReceipt(withdrawalReceipt);
  console.log(withdrawalReceipt);
});
