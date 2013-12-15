var AWS = require('aws-sdk');
var express = require("express");
var app = express();
app.use(express.bodyParser());

console.log('process.env.SQS_BITCOIN_TRANSACTION_QUEUE_NAME: ', process.env.SQS_BITCOIN_TRANSACTION_QUEUE_NAME);

AWS.config.update({region: 'us-east-1'});
var transactionQueue = new AWS.SQS();

function enqueueTransaction (jsonString, callback) {
  transactionQueue.getQueueUrl({ QueueName: process.env.SQS_BITCOIN_TRANSACTION_QUEUE_NAME }, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      transactionQueue.sendMessage({
        QueueUrl: data.QueueUrl,
        MessageBody: jsonString
      }, function (err, data) {
        if (err) {
          console.log(err);
          callback();
        } else {
          console.log('success!');
          callback();
        }
      });
    }
  })
}

app.post('/coinbase/transactions/callback', function (req, res) {
  var callbackJson = JSON.stringify(req.body);
  enqueueTransaction(callbackJson, function () {
    res.end();
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

