var BufferList = require('bitcoin-bufferlist')
var constants = require('bitcoin-constants')
var hash = require('bitcoin-hash')

var script = module.exports

// hex to readable
script.decode = function (buf) {
  if (!buf)
    return []

  var instructions = []
  var offset = 0
  var byte, length

  while (offset < buf.length) {
    byte = buf.readUInt8(offset)
    offset += 1

    if (0x01 <= byte && byte <= 0x4b) {
      instructions.push(Array.prototype.slice.call(buf.slice(offset, offset + byte), 0))
      offset += byte
      continue
    }

    if (byte === 0) {
      instructions.push([])
      continue
    }

    if (0x51 <= byte && byte <= 0x60) {
      instructions.push([byte - 0x50])
      continue
    }

    var opcode = constants.opcodesByVal[byte]

    if (opcode === 'pushdata1') {
      length = buf.readUInt8(offset)
      instructions.push(Array.prototype.slice.call(buf.slice(offset, offset + length), 0))
      offset += 1 + length

    } else if (opcode === 'pushdata2') {
      length = buf.readUInt16LE(offset)
      instructions.push(Array.prototype.slice.call(buf.slice(offset, offset + length), 0))
      offset += 2 + length

    } else if (opcode === 'pushdata4') {
      length = buf.readUInt32LE(offset)
      instructions.push(Array.prototype.slice.call(buf.slice(offset, offset + length), 0))
      offset += 4 + length

    } else {
      instructions.push(opcode || byte)
    }
  }

  return instructions
}

// readable to hex
script.encode = function (instructions) {
  var bl = new BufferList()

  if (!instructions)
    return bl.slice()

  for (var i = 0; i < instructions.length; i++) {
    var instr = instructions[i]

    if (Array.isArray(instr)) {
      if (instr.length === 0) {
        bl.writeUInt8(0)
      } else if (instr.length === 1 && 0 < instr[0] && instr[0] <= 16){
        bl.writeUInt8(0x50 + instr[0])
      } else if ( 1 <= instr.length && instr.length <= 0x4b) {
        bl.writeUInt8(instr.length)
        bl.append(instr)
      } else if (instr.length <= 0xff) {
        bl.writeUInt8(constants.opcodes.OP_PUSHDATA1)
        bl.writeUInt8(instr.length)
        bl.append(new Buffer(instr))
      } else if (instr.length <= 0xffff) {
        bl.writeUInt8(constants.opcodes.OP_PUSHDATA2)
        bl.writeUInt16LE(instr.length)
        bl.append(new Buffer(instr))
      } else {
        bl.writeUInt8(constants.opcodes.OP_PUSHDATA4)
        bl.writeUInt32LE(instr.length)
        bl.append(new Buffer(instr))
      }
      continue
    }

    bl.append(constants.opcodes[instr])
  }

  return bl.slice()
}

// interpreter
script.run = function (instructions, stack, tx) {
  var instr
  for (var i = 0; i < instructions.length; i++) {
    instr = instructions[i]

    if (Array.isArray(instr)) {
      stack.push(new Buffer(instr))

    } else if (instr === 'OP_DUP') {
      if (stack.length === 0)
        return false
      stack.push(stack[stack.length - 1])

    } else if (instr === 'OP_HASH160') {
      if (stack.length === 0)
        return false
      var val = new Buffer(stack.pop())
      stack.push(hash160(val))

    } else if (instr === 'OP_EQUALVERIFY') {
      if (stack.length < 2)
        return false
      if(!bufferEqual(stack.pop(), stack.pop()))
        return false

    } else if (instr === 'OP_CHECKSIG') {
      var pub = stack.pop()
      var sig = stack.pop()
      var type = sig[sig.length - 1]
      if (type !== 1)
        return false
      var res = ec.verify(tx, sig.slice(0, -1), pub)
      stack.push(res ? new Buffer([1]) : new Buffer([]))
    }
  }
  return true
}

// test
var spk = new Buffer('76a91430fc1ddd198e6f43edcbbf3d574179a0d15c620a88ac', 'hex')

var decoded = script.decode(spk)
//console.log(decoded);
//console.log(script.encode(decoded).toString('hex'));

var ss = new Buffer('493046022100b8f613c22981ef3781e5065a7b97e75e36cd6c2dd243d9e157224b32a4252de70221008afdd13dc0de16f5c560ac185f54e03956ad64c5633c76303ae6d3e76cb2d2b3012102ff0c56a6af3e721dbda5ce23b6e9cd5d9398f14c091ae42d89d963a5646f1d3c', 'hex')

var dss= script.decode(ss)
console.log(dss);
var stack = []
console.log(script.run(dss, stack), stack);

//var b = require('bcoin')

//var d = b.script.decode(Array.prototype.slice.call(spk, 0))
//console.log(d);
//console.log(b.utils.toHex(b.script.encode(d)));
