var buffertools = require('buffertools')
buffertools.extend()
var constants = require('./constants')

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
script.run = function (args) {
}

// test
var spk = new Buffer('76a91430fc1ddd198e6f43edcbbf3d574179a0d15c620a88ac', 'hex')

var decoded = script.decode(spk)
console.log(spk.toString('hex'));
console.log(decoded.join(' '));
console.log(script.encode(decoded).toString('hex'));
