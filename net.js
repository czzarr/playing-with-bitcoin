var BufferList = require('bitcoin-bufferlist')
var crypto = require('crypto')
var hash = require('bitcoin-hash')
var test= require('bitcoin-constants').test
var net = require('net')

var version = new BufferList()

// version
version.writeUInt32LE(test.version)
// services
version.writeUInt64LE(1)
// unix timestamp
version.writeUInt64LE(Math.round(new Date().getTime() / 1000))

var addrRecv = new BufferList()
addrRecv.writeUInt64LE(1)
addrRecv.append('00000000000000000000ffff', 'hex')
addrRecv.writeUInt8(127)
addrRecv.writeUInt8(0)
addrRecv.writeUInt8(0)
addrRecv.writeUInt8(1)
var port = new Buffer(2)
port.writeUInt16BE(test.port, 0)
addrRecv.append(port)
var addrRecv = addrRecv.slice()
console.log('net addrd', addrRecv);
console.log('net addr length', addrRecv.slice().length);

// addr_recv
version.append(addrRecv.slice())
// addr_from
version.append(addrRecv.slice())
// nonce
version.append(crypto.randomBytes(8))
// user agent
version.append(0)
// start height
version.writeUInt32LE(0)
// relay
version.append(0)
console.log(version);

var version = version.slice()
console.log('version length', version.length);

var msg = new BufferList()
// magic number
msg.writeUInt32LE(test.magic)
// command
var command = new Buffer(12)
command.fill(0)
command.write('version', 'ascii')
msg.append(command)
// payload length
msg.writeUInt32LE(version.length)
// payload checksum
msg.append(hash.dsha256(version).slice(0,4))
// payload
msg.append(version)
console.log('message', msg.slice());

var client = net.connect({ port: test.port, host: '46.4.120.71' }, function () {
  console.log('client connected');
  client.write(msg.slice(), function () {
    console.log('version written');
  })
})

client.on('data', function (data) {
  console.log('data', data);
})

client.on('error', function (err) {
  console.log(err);
})

client.on('end', function() {
  console.log('client disconnected');
});

client.on('close', function() {
  console.log('Connection closed');
});
