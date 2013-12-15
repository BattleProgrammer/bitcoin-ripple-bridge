 function Transaction(json) {
    try {
      var currency = json.transaction.Amount.currency || 'XRP';
      var amount;

      if (json.transaction.Amount.value) {
        amount = parseFloat(json.transaction.Amount.value);
      } else {
        amount = parseInt(json.transaction.Amount) / 1000000.0;
      }

      this._data = {
        status: json.engine_result,
        account: json.transaction.Account,
        currency: currency,
        amount: amount,
        destination: json.transaction.Destination
      }

    } catch(e) { return false }

    if (!this.is_valid()) { return false };
  }

  Transaction.prototype.is_valid = function () {
    return !!this._data.currency;
  }

  Transaction.prototype.to_json = function () {
    return JSON.stringify(this._data);
  }

  Transaction.prototype.getData = function () {
    return this._data;
  }

  module.exports = Transaction;