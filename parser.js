var script = require('./script')
var utils = require('bitcoin-buffer')

module.exports = Parser

function Parser() {
  if (!(this instanceof Parser))
    return new Parser()
}

// tx arrives in raw format (hex)
Parser.prototype.parse = function (buf) {
  var tx = {}
  tx.version = buf.readUInt32LE(0)

  var inputsCount = utils.readVarInt(buf, 4)
  var offset = inputsCount.offset
  tx.inputsCount = inputsCount.res

  tx.inputs = new Array(tx.inputsCount)
  for (var i = 0; i < tx.inputsCount; i++) {
    var input = this.parseIn(buf.slice(offset))
    tx.inputs.push(input)
    offset += input.size
  }

  var outputsCount = utils.readVarInt(buf, offset)
  offset = outputsCount.offset
  tx.outputsCount = outputsCount.res

  tx.outputs = new Array(tx.outputsCount)
  for (var i = 0; i < tx.outputsCount; i++) {
    var output = this.parseOut(buf.slice(offset))
    tx.outputs.push(output)
    offset += output.size
  }

  tx.locktime = buf.readUInt32LE(offset)
  return tx
}

Parser.prototype.parseIn = function (buf) {
  var txin = {}

  txin.prevHash = buf.slice(0, 32).toString('hex')
  txin.outputIndex = buf.readUInt32LE(32)

  var scriptLength = utils.readVarInt(buf, 36)
  var offset = scriptLength.offset
  txin.scriptLength = scriptLength.res
  txin.scriptSig = {}
  txin.scriptSig.hex = buf.slice(offset, offset + txin.scriptLength).toString('hex')
  txin.scriptSig.asm = script.decode(new Buffer(txin.scriptSig.hex, 'hex')).join(' ')

  txin.sequence = buf.readUInt32LE(offset + txin.scriptLength)
  txin.size = offset + txin.scriptLength + 4
  return txin
}

Parser.prototype.parseOut = function (buf) {
  var txout = {}

  txout.value = utils.readUInt64LE(buf, 0)

  var scriptPubKeyLength = utils.readVarInt(buf, 8)
  var offset = scriptPubKeyLength.offset
  txout.scriptPubKeyLength = scriptPubKeyLength.res
  txout.scriptPubKey = {}
  txout.scriptPubKey.hex = buf.slice(offset, offset + txout.scriptPubKeyLength).toString('hex')
  txout.scriptPubKey.asm = script.decode(new Buffer(txout.scriptPubKey.hex, 'hex')).join(' ')

  txout.size = offset + txout.scriptPubKeyLength
  return txout
}

// test
var parser = new Parser()
var tx = new Buffer('0100000001278d8a8b89da91ea532067cfed24003e1018048700cf6a9858035c510a1f1272010000006c493046022100b8f613c22981ef3781e5065a7b97e75e36cd6c2dd243d9e157224b32a4252de70221008afdd13dc0de16f5c560ac185f54e03956ad64c5633c76303ae6d3e76cb2d2b3012102ff0c56a6af3e721dbda5ce23b6e9cd5d9398f14c091ae42d89d963a5646f1d3cffffffff0140420f00000000001976a91430fc1ddd198e6f43edcbbf3d574179a0d15c620a88ac00000000', 'hex')
console.dir(parser.parse(tx))
console.dir(parser.parse(tx).inputs);
console.dir(parser.parse(tx).outputs);
