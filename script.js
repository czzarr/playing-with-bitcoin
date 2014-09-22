var BufferList = require('bitcoin-bufferlist')
var constants = require('bitcoin-constants')

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
//script.run = function (instructions, stack, tx) {
  //var instr
  //for (var i = 0; i < instructions.length; i++) {
    //instr = instructions[i]

    //if (Array.isArray(instr)) {
      //stack.push(instr)

    //} else if (instr === 'OP_DUP') {
      //if (stack.length === 0)
        //return false
      //stack.push(stack[stack.length - 1])

    //} else if (instr === 'OP_HASH160') {
      //if (stack.length === 0)
        //return false
      //var val = new Buffer(stack.pop(), 'hex')
      //stack.push(hash160(val).toString('hex'))

    //} else if (instr === 'OP_EQUALVERIFY') {
      //var val1 = stack.pop()
      //var val2 = stack.pop()
      //if (bufferEqual(val1, val2))
        //stack.push(0)

    //} else if (instr === 'OP_CHECKSIG') {
      //var pubkey = stack.pop()
      //var sig = stack.pop()
      //var type = sig[sig.length - 1]
      //if (type !== 1)
        //return false
      //var res = ec.verify(tx, sig.slice(0, -1), pubkey)
      //stack.push(res ? [1] : [])
    //}
  //}
//}


// test
var spk = new Buffer('76a91430fc1ddd198e6f43edcbbf3d574179a0d15c620a88ac', 'hex')

var decoded = script.decode(spk)
//console.log(decoded);
console.log(script.encode(decoded).toString('hex'));


//var b = require('bcoin')

//var d = b.script.decode(Array.prototype.slice.call(spk, 0))
//console.log(d);
//console.log(b.utils.toHex(b.script.encode(d)));
