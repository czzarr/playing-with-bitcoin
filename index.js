var bs58 = require('bs58')
var coinkey = require('coinkey')
var coinstring = require('coinstring')
var EC = require('elliptic').ec
var hash = require('hash.js')

var ec = new EC('secp256k1')
var version = new Buffer('6f', 'hex')
console.log('version:', version.toString('hex'));

var private = new Buffer('561c22b620ed54b3f5322dc0ca2154d4e3536a71493ee7af4bd3e56d6780c0ab', 'hex')

var keypair = ec.keyPair(private)
console.log(keypair);

var public = new Buffer(keypair.getPublic(true, 'hex'), 'hex')
console.log('public:', public.toString('hex'));

var ripesha = new Buffer(hash.ripemd160().update(hash.sha256().update(public).digest()).digest('hex'), 'hex')
console.log('ripesha:', ripesha.toString('hex'));

var keyhash = Buffer.concat([version, ripesha])
console.log('keyhash:', keyhash.toString('hex'));

var doublesha256 = new Buffer(hash.sha256().update(hash.sha256().update(keyhash, 'hex').digest()).digest('hex'), 'hex')
console.log('doublesha256: ', doublesha256.toString('hex'));

var checksum = doublesha256.slice(0, 4)
console.log('checksum: ', checksum.toString('hex'));

var address = bs58.encode(Buffer.concat([keyhash, checksum]))
console.log('address:', address);

