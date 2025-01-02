// TODO BRIDGE: fix parsing error
BigInt.prototype.toJSON = function () {
  return this.toString();
};
