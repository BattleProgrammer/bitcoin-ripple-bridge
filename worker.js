var AWS = require('aws-sdk'),
    WebSocket = require('ws'),
		Coinbase = require('coinbase-node'),
		Ripple = {};

Ripple.Transaction = require('./ripple/transaction.js');

var coinbaseClient = new Coinbase.Client({
  api_key: process.env.COINBASE_API_KEY
});

console.log('process.env.SQS_TRANSACTION_QUEUE_NAME: ', process.env.SQS_TRANSACTION_QUEUE_NAME);

AWS.config.update({region: 'us-east-1'});
var transactionQueue = new AWS.SQS();

function onOpen() {
  console.log('connection opened');
  var accountId = process.env.RIPPLE_ADDRESS;
  this.send('{"command":"subscribe","id":0,"accounts":["'+accountId+'"]}');
  console.log('listening for activity for account: '+ accountId);
}

function withdrawBitcoins(transaction, bitcoinAddress){
  var data = transaction.getData();	
  if (data.currency == 'BTC') {
    coinbaseClient.send_money(bitcoinAddress, data.amount, function(err, resp){
			console.log(resp);
		});	
	}	
}

function enqueueTransaction(transaction) {
	transactionQueue.getQueueUrl({ QueueName: process.env.SQS_TRANSACTION_QUEUE_NAME }, function (err, queue) {
		if (err) {
			console.log(err);
		} else {
			transactionQueue.sendMessage({
				QueueUrl: queue.QueueUrl,
				MessageBody: transaction.to_json()
			}, function (err, data) {
				if (err) { console.log(err);
				} else { console.log(data);	}
			});
		}
	});
}

function onMessage(data, flags) {
  var response = JSON.parse(data);
	console.log(response);
  if (response.type == 'transaction') {
    var transaction = new Ripple.Transaction(response);
		console.log(transaction.getData());
    withdrawBitcoins(transaction, '1sGtXBNWW4gjv4aToXA4hqLJqPrjscKok');
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




