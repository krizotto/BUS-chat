let express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);


/*
  // crypto
let crypto = require('crypto');
 
// generate random passphrase binary data
let r_pass = crypto.randomBytes(128);
 
// convert passphrase to base64 format
let r_pass_base64 = r_pass.toString("base64"); 

console.log("passphrase base64 format: ");
console.log(r_pass_base64);

var node_cryptojs = require('node-cryptojs-aes');
 
// node-cryptojs-aes main object;
var CryptoJS = node_cryptojs.CryptoJS;
 
// custom json serialization format
var JsonFormatter = node_cryptojs.JsonFormatter;
 
// message to cipher
var message = "I love maccas!";
 
// encrypt plain text with passphrase and custom json serialization format, return CipherParams object
// r_pass_base64 is the passphrase generated from first stage
// message is the original plain text  
 
var encrypted = CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });
 
// convert CipherParams object to json string for transmission
var encrypted_json_str = encrypted.toString();
 
console.log("serialized CipherParams object: ");
console.log(encrypted_json_str);


var decrypted = CryptoJS.AES.decrypt(encrypted,r_pass_base64);

console.log(decrypted.toString());
*/
//lower-better
/*
var CryptoJS = require('crypto-js');
var key = '1234567890123456';
let encrypt = function(obj)
{
    return CryptoJS.AES.encrypt(JSON.stringify(obj), key);
};
let decrypt = function(obj)
{
    return JSON.parse(CryptoJS.AES.decrypt(obj, key)
        .toString(CryptoJS.enc.Utf8));
};

*/
let CryptoJS = require('crypto-js');
let key = CryptoJS.enc.Utf8.parse('1234567890123456');

function encrypt(msgString, key) {
    // msgString is expected to be Utf8 encoded
    let iv = CryptoJS.lib.WordArray.random(16);
    let encrypted = CryptoJS.AES.encrypt(msgString, key, {
        iv: iv
    });
    return iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
}

function decrypt(ciphertextStr, key) {
    let ciphertext = CryptoJS.enc.Base64.parse(ciphertextStr);

    // split IV and ciphertext
    let iv = ciphertext.clone();
    iv.sigBytes = 16;
    iv.clamp();
    ciphertext.words.splice(0, 4); // delete 4 words = 16 bytes
    ciphertext.sigBytes -= 16;

    // decryption
    let decrypted = CryptoJS.AES.decrypt({ciphertext: ciphertext}, key, {
        iv: iv
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}
//events
server.listen(process.env.PORT || 5000); //choose port

app.use(express.static(__dirname + '/public')); //directory to static files (*.css, *.js)
app.get('/',function(req,res){
  res.sendFile(__dirname+'/index.html');
}); //redirect to index.html on main page


io.sockets.on('connection', function (socket) {

  console.log("Socket connected.");

  socket.on('connection-request', function(json){
    console.log(json)
    io.emit('connection-response', json)
  })

  socket.on('message-request', function(json){
    let mystring = json['message']

    console.log('Encrypted message: '+ mystring)
    console.log('Decrypted message: '+ decrypt(mystring,key))
    
    io.emit('message-response', json)
  })
  
});

