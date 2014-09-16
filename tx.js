var buffertools = require('buffertools')
buffertools.extend()
var EC = require('elliptic').ec
var hash = require('hash.js')
var opcodes = require('./constants').opcodes
var script = require('./script')

var hexTransaction = new Buffer('010000000438609f5db075726205cdaebccbd82a7a63fa7b48fe119c33d3d9944984f7a7f2010000006b483045022100c433099a511e6acc332a5963d22cde4afc6a945d951e11de5f617056cf22a2d0022075218dffaa31902fe6f2e6ee754106245f872c962d13836d040a7db97c7923ab01210294ba2c89e4554a0b7324a654a62843d7bf8e67140c4dd192d0f999abab568816ffffffff4a45a85c9d31b94e35be88c4e18cce42a3c6ddb6b10bdce0858edc17dc688ee1000000006b483045022100fab2303e02394e620df8974c15e64ae338081ec9903ae90ecebfc2c4c679c9cc0220009054f8cd6add400c341d268e1412fde56f732632fb41eb368d313ed406b4ce012103db0fc4243afb5dcb6b164f30661cdf29dbb637017e59083e5b91a4e85f86555bffffffff45f4ee45fa787248a8d26dffd1b19488a4c6e88e70db466c896912d9c0957ac2000000006a4730440220398ee1a6fa9f5b7970feba02aa0d3435a740ff76dfbed7f24d452e0c48328da80220394a4b64383e2f75fcd19ade41290dadf2cbdb34eaf1b03032864cc5fd86ff81012103db0fc4243afb5dcb6b164f30661cdf29dbb637017e59083e5b91a4e85f86555bffffffff2d3efde69d53ec18950d1107f9244b10e6cebcd57b8c0b7d9309dc300c6a42b4010000006a47304402201361b054e039b1218ad1b8d6a8b89bd1d31ced3a8cf45b94dc5ea7c8b1166d9a022060d9552fde6a37eb35ac30793cb1625decff314e194a61821bcd7b51ce6071e60121030cb9d78bb707d0deae4b6497c7cdb4154d50a4053b982219baab64b53644517fffffffff0293d90f00000000001976a9144b87255bc72f200a4a32c826e286d3ceb2fb5c2988ac40420f00000000001976a9148488eee34d08d2fef170566301f1befbdda8b6c088ac00000000', 'hex')
var prevHash = dsha256(hexTransaction)
var outputIndex = new Buffer('01000000', 'hex') // 1
var sendToAddress = 'mjyxkdjbWsg3e1m1yxLyaEr16T5Hnzn4b8'
var hash160 = new Buffer('30fc1ddd198e6f43edcbbf3d574179a0d15c620a', 'hex')
var amount = 1000000 // 0.01BTC
var private = new Buffer('561c22b620ed54b3f5322dc0ca2154d4e3536a71493ee7af4bd3e56d6780c0ab', 'hex')
var ec = new EC('secp256k1')
var keypair = ec.keyPair(private)
var public = new Buffer(keypair.getPublic(true, 'hex'), 'hex')
//console.log('public', public.toString('hex'));

var tx = {}

tx.version = new Buffer('01000000', 'hex')

// Input
tx.inputsCount = numToVarInt(1)
tx.ins = []
tx.ins[0] = {}
tx.ins[0].prevHash = prevHash
tx.ins[0].outputIndex = outputIndex
tx.ins[0].scriptSig = new Buffer('76a9148488eee34d08d2fef170566301f1befbdda8b6c088ac', 'hex')
tx.ins[0].scriptSigSize = numToVarInt(tx.ins[0].scriptSig.length)
tx.ins[0].sequence = new Buffer('ffffffff', 'hex')

// Output
tx.outputsCount = numToVarInt(1)
tx.outs = []
tx.outs[0] = {}
tx.outs[0].value = new Buffer(8)
tx.outs[0].value.clear()
writeUInt64LE(tx.outs[0].value, amount, 0)
tx.outs[0].scriptPubKey = {}
tx.outs[0].scriptPubKey.hex = buffertools.concat(
  new Buffer([opcodes.OP_DUP]),
  new Buffer([opcodes.OP_HASH160]),
  new Buffer('14', 'hex'),
  hash160,
  new Buffer([opcodes.OP_EQUALVERIFY]),
  new Buffer([opcodes.OP_CHECKSIG])
)
tx.outs[0].scriptPubKey.asm = script.decode(tx.outs[0].scriptPubKey.hex)
tx.outs[0].scriptPubKeySize = numToVarInt(tx.outs[0].scriptPubKey.hex.length)

tx.locktime = new Buffer('00000000', 'hex')
tx.hashcode = new Buffer('01000000', 'hex') // sighash_all

//console.dir(tx);
var transaction = buffertools.concat(
  tx.version,
  tx.inputsCount,
  tx.ins[0].prevHash,
  tx.ins[0].outputIndex,
  tx.ins[0].scriptSigSize,
  tx.ins[0].scriptSig,
  tx.ins[0].sequence,
  tx.outputsCount,
  tx.outs[0].value,
  tx.outs[0].scriptPubKeySize,
  tx.outs[0].scriptPubKey.hex,
  tx.locktime,
  tx.hashcode
)
//console.log('script less tx');
//console.log(tx.version.toString('hex'));
//console.log(tx.inputsCount.toString('hex'));
//console.log(tx.ins[0].prevHash.toString('hex'));
//console.log(tx.ins[0].outputIndex.toString('hex'));
//console.log(tx.ins[0].scriptSigSize.toString('hex'));
//console.log(tx.ins[0].scriptSig.toString('hex'));
//console.log(tx.ins[0].sequence.toString('hex'));
//console.log(tx.outputsCount.toString('hex'));
//console.log(tx.outs[0].value.toString('hex'));
//console.log(tx.outs[0].scriptPubKeySize.toString('hex'));
//console.log(tx.outs[0].scriptPubKey.hex.toString('hex'));
//console.log(tx.locktime.toString('hex'));
//console.log(tx.hashcode.toString('hex'));
//console.log();
//console.log();

var hashScriptless = dsha256(transaction)
//console.log(hashScriptless.toString('hex'));

// sign
var signature = new Buffer(ec.sign(hashScriptless, private).toDER('hex'), 'hex')

// append the hashtype byte
signature = signature.concat(new Buffer('01', 'hex'))
//console.log('signature with hashtype byte');
//console.log(signature.toString('hex'));

// verification that ripesha of public key matches scriptPubKey of output of redeemed tx
//console.log(ripesha(public).toString('hex'));
//console.log(tx.ins[0].scriptSig.slice(3,-2).toString('hex'));

// final transaction
var finaltx = buffertools.concat(
  tx.version,
  tx.inputsCount,
  tx.ins[0].prevHash,
  tx.ins[0].outputIndex
)

var scriptSig = buffertools.concat(
  new Buffer(signature.length.toString(16), 'hex'),
  signature,
  new Buffer(public.length.toString(16), 'hex'),
  public
)

var scriptSigSize = numToVarInt(scriptSig.length)

finaltx = finaltx.concat(
  scriptSigSize,
  scriptSig,
  tx.ins[0].sequence,
  tx.outputsCount,
  tx.outs[0].value,
  tx.outs[0].scriptPubKeySize,
  tx.outs[0].scriptPubKey.hex,
  tx.locktime
)
console.log('final tx');
console.log(tx.version.toString('hex'));
console.log(tx.inputsCount.toString('hex'));
console.log(tx.ins[0].prevHash.toString('hex'));
console.log(tx.ins[0].outputIndex.toString('hex'));
console.log(scriptSigSize.toString('hex'));
console.log(scriptSig.toString('hex'));
console.log(tx.ins[0].sequence.toString('hex'));
console.log(tx.outputsCount.toString('hex'));
console.log(tx.outs[0].value.toString('hex'));
console.log(tx.outs[0].scriptPubKeySize.toString('hex'));
console.log(tx.outs[0].scriptPubKey.hex.toString('hex'));
console.log(tx.outs[0].scriptPubKey.asm.join(' '));
console.log(tx.locktime.toString('hex'));

console.log();
console.log();
console.log(finaltx.toString('hex'));

function ripesha (buf) {
  return new Buffer(hash.ripemd160().update(hash.sha256().update(buf).digest()).digest('hex'), 'hex')
}

function dsha256 (buf) {
  return new Buffer(hash.sha256().update(hash.sha256().update(buf).digest()).digest('hex'), 'hex')
}

function numToVarInt (n) {
  if (n < 0xfd) {
    var res = new Buffer(1)
    res.clear()
    res.writeUInt8(n, 0)
    return res
  } else if (n <= 0xffff) {
    var res = new Buffer(3)
    res.clear()
    res[0] = 0xfd
    res.writeUInt16LE(n)
    return res
  } else if (n <= 0xffffffff) {
    var res = new Buffer(5)
    res.clear()
    res[0] = 0xfe
    res.writeUInt32LE(n)
    return res
  } else {
    var res = new Buffer(9)
    res.clear()
    res[0] = 0xff
    writeUInt64LE(res, n, 1)
    return res
  }
}

// https://github.com/bitcoinjs/bitcoinjs-lib/blob/cc98600154bf921acaff2efd907c1fcec08232e8/src/bufferutils.js
function writeUInt64LE(buffer, value, offset) {
  buffer.writeInt32LE(value & -1, offset)
  buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4)
}
