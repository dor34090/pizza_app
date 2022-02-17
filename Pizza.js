"use strict";
exports.__esModule = true;
var Pizza = /** @class */ (function () {
  function Pizza(topNum) {
    this.isReady = false;
    this.toppings = new Array(topNum);
    this.startTime = 0;
    this.endTime = 0;
  }
  Pizza.prototype.ready = function () {
    this.isReady = true;
  };
  Pizza.prototype.finish = function () {
    this.endTime = Date.now();
  };
  Pizza.prototype.start = function () {
    this.startTime = Date.now();
  };
  return Pizza;
})();
exports["default"] = Pizza;
