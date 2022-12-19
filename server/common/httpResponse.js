var HttpErrorCode = require("./constant/httpCode.json");
var customError = require("./error/customError");

var HttpResponse = function() {
  this.httpCode = HttpErrorCode.Success;
  this.data;
  this.error;
};

HttpResponse.prototype.setHttpCode = function(httpCode) {
  this.httpCode = httpCode;
  return this;
};

HttpResponse.prototype.setData = function(successCode, data) {
  this.data = data;
  this.meta = successCode;
  return this;
};

HttpResponse.prototype.setError = function(errorCode) {
  if (errorCode.httpCode) {
    this.httpCode = errorCode.httpCode;
  }

  this.meta = errorCode;
  return this;
};

HttpResponse.prototype.send = function(res) {
  res
    .status(this.httpCode)
    .json({ error: this.error, data: this.data, meta: this.meta });
};

module.exports = HttpResponse;
