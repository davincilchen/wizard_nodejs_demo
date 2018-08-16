let env = require('./env');
let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let wizard = require('wizard_nodejs');
//let Util = require('ethereumjs-util');
let axios = require('axios');
let Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider(env.web3Url));
let InfinitechainBuilder = wizard.InfinitechainBuilder;
let Types = wizard.Types;
let urlWizardNodeSvr = 'http://127.0.0.1:3001/pay';
let urlGrigotts = 'http://127.0.0.1:3000';
let infinitechain = new InfinitechainBuilder()
  .setNodeUrl(env.nodeUrl)
  .setWeb3Url(env.web3Url)
  .setSignerKey(env.signerKey)
  .setStorage('memory')
  .build();

let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

let server = require('http').createServer(app);

// two phase termination
let couldGracefulShotdown = true;

app.get('/balance/:address', async function (req, res) {
  let asset = env.assetAddress.padStart(64, '0');
  let address = req.params.address.toLowerCase();
  let data = await getBalance(address,asset);
  res.send(data);
});

app.post('/tokenDeposit/:address/:value', async function (req, res) {

  //auto mint?  X 
  console.log("Token Deposit");
  let address = req.params.address.toLowerCase();
  let value = req.params.value;
  console.log("address = ", address, ", value = ", value);
  console.log(address);
  console.log(value);

  let asset = env.assetAddress.padStart(64, '0');
  await remittance(infinitechain,address,value,asset);
  res.send({ ok: true });

  /*
  let asset = env.assetAddress.padStart(64, '0');
  let remittanceData = {
    from: infinitechain.signer.getAddress(),
    to: address,
    //assetID: '0'.padStart(64, '0'),
    assetID: asset,
    value: value,
    //value: 10.2,
    //fee: 0.002
    fee: 0
  };

  console.log(remittanceData);

  try {
    console.log('--------------------------------');
    let lightTx = await infinitechain.client.makeLightTx(Types.remittance, remittanceData);
    
    //console.log(lightTx);

    let resLocal = await axios.post(urlWizardNodeSvr, lightTx.toJson());
    console.log(resLocal.data);
    

    console.log('-------------------------------');
    res.send({ ok: true, lightTx: lightTx, receipt: resLocal.data});
    //res.send({ ok: true });
    //res.send(lightTx.lightTxHash);
    //return lightTx.lightTxHash;
  } catch(e) {
    console.log('-------------2---');
    console.log(e);
  }
  */

  /*
  try {
    let lightTxJson = req.body;
    let lightTx = new LightTransaction(lightTxJson);
    let signedLightTx = infinitechain.signer.signWithServerKey(lightTx);
    let receipt = await infinitechain.server.sendLightTx(signedLightTx);

    let signedReceipt = infinitechain.signer.signWithServerKey(receipt);
    res.send(signedReceipt);
  } catch (e) {
    console.error(e);
    res.status(500).send({ errors: e.message });
  }
  */
});

  

let remittance = async (chain, to, value, asset) => {
  let remittanceData = {
    from: chain.signer.getAddress(),
    to: to,
    //assetID: '0'.padStart(64, '0'),
    assetID: asset,
    value: value,
    //fee: 0.002
    fee: 0
  };
  try {
    let lightTx = await chain.client.makeLightTx(Types.remittance, remittanceData);
    let resLocal = await axios.post(urlWizardNodeSvr, lightTx.toJson());
    console.log(resLocal.data);
    return lightTx.lightTxHash;
  } catch(e) {
    console.log(e);
  }
};

let getBalance = async  (address, assetID) => {
  if (!assetID) {
    assetID = '0'.padStart(64, '0');
  } else {
    assetID = assetID.toString().padStart(64, '0');
  }

  let url = urlGrigotts + '/balance/' + address + '?assetID=' + assetID;
  console.log(url);
  let res = await axios.get(url);
  console.log(res.data);
  return res.data
};

server.listen(3002, async function () {
  try {
    console.log('App listening on port 3002!');
  } catch (e) {
    console.error(e.message);
  }
});
  
if (process.platform === 'win32') {
  let rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

process.on('SIGINT', function () {
  if (couldGracefulShotdown) {
    process.exit();
  }

  setInterval(() => {
    process.exit();
  }, 1000);
});
  


