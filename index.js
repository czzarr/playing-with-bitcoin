var bs58 = require('bs58')
var coinkey = require('coinkey')
var coinstring = require('coinstring')
var EC = require('elliptic').ec
var hash = require('bitcoin-hash')

var ec = new EC('secp256k1')
var version = new Buffer('6f', 'hex')
console.log('version:', version.toString('hex'));

var private = new Buffer('561c22b620ed54b3f5322dc0ca2154d4e3536a71493ee7af4bd3e56d6780c0ab', 'hex')

var keypair = ec.keyPair(private)
console.log(keypair);

var public = new Buffer(keypair.getPublic(true, 'hex'), 'hex')
console.log('public:', public.toString('hex'));

var hash160 = hash.hash160(public)
console.log('hash160:', hash160.toString('hex'));

var keyhash = Buffer.concat([version, hash160])
console.log('keyhash:', keyhash.toString('hex'));

var dsha256 = hash.dsha256(keyhash)
console.log('dsha256: ', dsha256.toString('hex'));

var checksum = dsha256.slice(0, 4)
console.log('checksum: ', checksum.toString('hex'));

var address = bs58.encode(Buffer.concat([keyhash, checksum]))
console.log('address:', address);
