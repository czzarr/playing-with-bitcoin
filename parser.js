module.exports = Parser



function Parser() {
  if (!(this instanceof Parser))
    return new Parser()
}

// tx arrives in raw format (hex)
Parser.prototype.parse = function (buf) {
  var tx = {}
  tx.version = buf.readUInt32LE(0)
  tx.inputsCount = readVarInt(buf, 4)
  tx.vin = this.parseIn(buf.slice(tx.inputsCount.offset))
  tx.outputsCount = readVarInt(buf, tx.inputsCount.offset + tx.vin.offset)
  tx.vout = this.parseOut(buf.slice(tx.outputsCount.offset))
  tx.locktime = buf.slice(-4).toString('hex')
  return tx
}

Parser.prototype.parseIn = function (buf) {
  var txin = {}
  txin.prevHash = buf.slice(0, 32).toString('hex')
  txin.outputIndex = buf.slice(32, 36).toString('hex')
  txin.scriptLength = readVarInt(buf, 36)
  txin.scriptSig = buf.slice(txin.scriptLength.offset, txin.scriptLength.offset + txin.scriptLength.res).toString('hex')
  txin.sequence = buf.slice(txin.scriptLength.offset + txin.scriptLength.res, txin.scriptLength.offset + txin.scriptLength.res+4).toString('hex')
  txin.offset = txin.scriptLength.offset + txin.scriptLength.res + 4
  return txin
}

Parser.prototype.parseOut = function (buf) {
  var txout = {}
  txout.value = readUInt64LE(buf, 0)
  txout.scriptPubKeyLength = readVarInt(buf, 8)
  txout.scriptPubKey = buf.slice(txout.scriptPubKeyLength.offset, txout.scriptPubKeyLength.offset + txout.scriptPubKeyLength.res).toString('hex')
  return txout
}

function readVarInt (buf, offset) {
  if (!offset)
    offset = 0

  var res, size

  if (buf[offset] < 0xfd) {
    res = buf.readUInt8(offset)
    size = 1
  } else if (buf[offset] === 0xfd) {
    res = buf.readUInt16LE(offset+1)
    size = 3
  } else if (buf[offset] === 0xfe) {
    res = buf.readUInt32LE(offset+1)
    size = 5
  } else if (buf[offset] === 0xff) {
    res = readUInt64LE(buf, offset+1)
    size = 9
  }

  return { res: res, offset: offset + size }
}

https://github.com/bitcoinjs/bitcoinjs-lib/blob/cc98600154bf921acaff2efd907c1fcec08232e8/src/bufferutils.js
function readUInt64LE(buf, offset) {
  var a = buf.readUInt32LE(offset)
  var b = buf.readUInt32LE(offset + 4)
  b *= 0x100000000
  return b + a
}

// test
var parser = new Parser()
var tx = new Buffer('0100000001278d8a8b89da91ea532067cfed24003e1018048700cf6a9858035c510a1f1272010000006c493046022100b8f613c22981ef3781e5065a7b97e75e36cd6c2dd243d9e157224b32a4252de70221008afdd13dc0de16f5c560ac185f54e03956ad64c5633c76303ae6d3e76cb2d2b3012102ff0c56a6af3e721dbda5ce23b6e9cd5d9398f14c091ae42d89d963a5646f1d3cffffffff0140420f00000000001976a91430fc1ddd198e6f43edcbbf3d574179a0d15c620a88ac00000000', 'hex')
console.dir(parser.parse(tx));
