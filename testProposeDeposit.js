let wizard = require('wizard_nodejs');
let level = require('level');
let env = require('./env');
let axios = require('axios');
let Web3 = require('web3');

let db = level('./db', { valueEncoding: 'json' });
let Receipt = wizard.Receipt;
// let Types = wizard.Types;
let url = 'http://127.0.0.1:3001/pay';
let web3 = new Web3(new Web3.providers.HttpProvider(env.web3Url));

let credentials;
let token;

let infinitechain = new wizard.InfinitechainBuilder()
  .setNodeUrl(env.nodeUrl)
  .setWeb3Url(env.web3Url)
  .setSignerKey(env.signerKey)
  .setStorage('level', db)
  .setReceiptSyncer('googleDrive', credentials)
  .setSyncerToken(token)
  .build();

infinitechain.initialize().then(async () => {
  // Simulate proposeDeposit
  web3.eth.sendTransaction({
    from: web3.eth.coinbase,
    to: infinitechain.contract.booster().address,
    value: web3.toWei(10000, 'ether'),
    gas: 150000
  });
  console.log('proposeDeposit');

  // onDeposit
  infinitechain.event.onDeposit((err, result) => {
    console.log('Deposit:');
    console.log(result);
  });

  // proposeDeposit
  let depositLightTx = await infinitechain.client.makeProposeDeposit('0x0'.padEnd(66, '0'));

  let response = await axios.post(url, depositLightTx.toJson());
  let depositReceiptJson = response.data;

  let depositReceipt = new Receipt(depositReceiptJson);

  await infinitechain.client.saveReceipt(depositReceipt);
  await infinitechain.client.syncReceipts();
});
