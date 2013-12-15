var AWS = require('aws-sdk');
var WebSocket = require('ws');
var Ripple = {};
Ripple.Transaction = require('./ripple/transaction.js');

console.log('process.env.SQS_TRANSACTION_QUEUE_NAME: ', process.env.SQS_TRANSACTION_QUEUE_NAME);

AWS.config.update({region: 'us-east-1'});
var transactionQueue = new AWS.SQS();

function onOpen() {
  console.log('connection opened');
  var accountId = process.env.RIPPLE_ADDRESS;
  this.send('{"command":"subscribe","id":0,"accounts":["'+accountId+'"]}');
  console.log('listening for activity for account: '+ accountId);
}

function onMessage(data, flags) {
  var response = JSON.parse(data);
  if (response.type == 'transaction') {
    var transaction = new Ripple.Transaction(response);

    console.log('enqueuing transaction: ');
    console.log(transaction.to_json());
    transactionQueue.getQueueUrl({ QueueName: process.env.SQS_TRANSACTION_QUEUE_NAME }, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        transactionQueue.sendMessage({
          QueueUrl: data.QueueUrl,
          MessageBody: transaction.to_json()
        }, function (err, data) {
          if (err) {
            console.log('error!');
            console.log(err);
          } else {
            console.log('success!');
            console.log(data);
          }
        });
      }

    })


  } else {
    console.log(response);
  }
}

function onClose() {
  console.log('connection closed')
  delete this;
  connectWebsocket('wss://s1.ripple.com');
}

function connectWebsocket(url) {
  console.log('connecting to '+url);
  try {
    var ws = new WebSocket(url);
    ws.on('open', onOpen);
    ws.on('message', onMessage);
    ws.on('close', onClose);
  } catch(e) {
    console.log('error connecting', e);
    console.log('trying again...');
    connectWebsocket(url);
  }
}

connectWebsocket('wss://s1.ripple.com');




