let express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    session = require('express-session'),
    CryptoJS = require('crypto-js'),
    uuid = require('uuid/v4');
    //RedisStore = require('connect-redis')(session);





let key = CryptoJS.enc.Utf8.parse('1234567890123456');
console.log('Server listening on port 5000...')

let fs = require("fs");
//
// let privateKey;
// let publicKey = "abc";

let privateKey = fs.readFileSync("./keys/private-key.pem", function (err, data) {
    if (err) throw err;
}).toString();

let publicKey = fs.readFileSync("./keys/public-key.pem", function (err, data) {
    if (err) throw err;
}).toString();


const JSEncrypt = require('node-jsencrypt');

const jsEncrypt = new JSEncrypt();

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


let sessionMiddleware = session({
    genid: (req) => {
      return uuid() // use UUIDs for session IDs
    },
    username: 'defaultuser',
    symmetricKey: 'random',
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  })
app.use(sessionMiddleware)

// io.use(function(socket, next) {
//     sessionMiddleware(socket.request, socket.request.res, next);
// });
  



//events
server.listen(process.env.PORT || 5000); //choose port

app.use(express.static(__dirname + '/public')); //directory to static files (*.css, *.js)
app.get('/', function (req, res) {
    
    console.log('Session unique ID: '+req.sessionID)

    res.sendFile(__dirname + '/index.html');
}); //redirect to index.html on main page






io.sockets.on('connection', function (socket) {


    socket.on('connection-request', function (json) {

        console.log("Socket connected.");
        let encryptedSymmetricKey = json['encryptedSymmetricKey'];
        console.log("Encrypted symmetric key: " + encryptedSymmetricKey);
        let decryptor = new JSEncrypt();
        decryptor.setPrivateKey(privateKey);
        let decryptedSymmetricKey = decryptor.decrypt(encryptedSymmetricKey);

        console.log('Decrypted symmetric key: ' + decryptedSymmetricKey);
        // socket.request.session.symmetricKey = decryptedSymmetricKey;
        // console.log('Moj symetryczny klucz: '+socket.request.session.symmetricKey)
        //teraz trzebaby go przekazac do sesji i uzywac przy messagach
        // socket.request.session.symmetricKey = 2
        io.emit('connection-response', json)
    })

    socket.on('message-request', function (json) {
        let mystring = json['message']
        //server-side decryption
        console.log('Encrypted message: ' + mystring)
        console.log('Decrypted message: ' + decrypt(mystring, key))

        io.emit('message-response', json)
    })

});



