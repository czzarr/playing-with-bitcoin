var buffertools = require('buffertools')
buffertools.extend()
var constants = require('bitcoin-constants')

var script = module.exports

// hex to readable
script.decode = function (buf) {
  var instructions = []
  var offset = 0
  var byte, length
  while (offset < buf.length) {
    byte = buf.readUInt8(offset)
    if (byte >= 0x01 && byte <= 0x4b) {
      instructions.push(byte.toString(16))
      offset += 1
      instructions.push(buf.slice(offset, offset + byte).toString('hex'))
      offset += byte
    } else {
      instructions.push(constants.opcodesByVal[byte])
      offset += 1
      if (byte === 0x4c) {
        length = buf.readUInt8(offset)
        instructions.push(buf.slice(offset, offset + length).toString('hex'))
        offset += 1
      } else if (byte === 0x4d) {
        length = buf.readUInt16LE(offset)
        instructions.push(buf.slice(offset, offset + length).toString('hex'))
        offset += 2
      } else if (byte === 0x4e) {
        length = buf.readUInt32LE(offset)
        instructions.push(buf.slice(offset, offset + length).toString('hex'))
        offset += 4
      }
    }
  }
  return instructions
}

// readable to hex
script.encode = function (instructions) {
  var buf = new Buffer(0, 'hex')
  var instr
  for (var i = 0; i < instructions.length; i++) {
    instr = instructions[i]
    if (instr.match(/^OP_[A-Z0-9]*$/)) {
      buf = buf.concat(new Buffer([constants.opcodes[instr]]))
      if (instr === 'OP_PUSHDATA1' || instr === 'OP_PUSHDATA2' || instr === 'OP_PUSHDATA4') {
        buf = buf.concat(new Buffer(instructions[i+1], 'hex'))
      }
    } else if (instr >= 0x01 && instr <= 0x4b) {
      buf = buf.concat(new Buffer([instr]), new Buffer(instructions[i+1], 'hex'))
    }
  }
  return buf
}

// interpreter
script.run = function (instructions, stack, tx) {
  var instr
  for (var i = 0; i < instructions.length; i++) {
    instr = instructions[i]
    if (Array.isArray(instr)) {
      stack.push(instr)
    } else if (instr === 'OP_DUP') {
      if (stack.length === 0)
        return false
      stack.push(stack[stack.length - 1])
    } else if (instr === 'OP_HASH160') {
      if (stack.length === 0)
        return false
      var val = new Buffer(stack.pop(), 'hex')
      stack.push(hash160(val).toString('hex'))
    } else if (instr === 'OP_EQUALVERIFY') {
      var val1 = stack.pop()
      var val2 = stack.pop()
      if (val1 !== val2)
        stack.push(0)
    } else if (instr === 'OP_CHECKSIG') {
      var pubkey = stack.pop()
      var sig = stack.pop()
      var type = sig[sig.length - 1]
      if (type !== 1)
        return false
      var res = ec.verify(tx, sig.slice(0, -1), pubkey)
      stack.push(res ? [1] : [])
    }
  }
}


// test
var spk = new Buffer('76a91430fc1ddd198e6f43edcbbf3d574179a0d15c620a88ac', 'hex')

var decoded = script.decode(spk)
console.log(spk.toString('hex'));
console.log(decoded.join(' '));
console.log(script.encode(decoded).toString('hex'));
