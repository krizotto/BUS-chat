let express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require("fs"),
    CryptoJS = require('crypto-js');

const JSEncrypt = require('node-jsencrypt');

let Dictionary = function () {
    this.data = {};
    this.add = function (key, value) {
        this.data[key] = value;
    };
    this.remove = function (key) {
        delete this.data[key];
    };
    this.has = function (key) {
        return key in this.data;
    };
    this.get = function (key) {
        return this.has(key) ? this.data[key] : undefined;
    };
    this.viewAll = function () {
        console.log('\n-------------------')
        console.log('USER  --->  KEY')
        for (var key in this.data) {
            console.log(key + " -> " + this.data[key]);
        }
        console.log('\n-------------------')
    };

    this.encryptAndEmit = function (json) {
        let myMessage = json['message'];
        for (let key in this.data) {
            let encryptedMessage = encrypt(myMessage, this.get(key));
            json['message'] = encryptedMessage
            io.to(key).emit('message-response', json);
        }
    }
};

let socketKeyDictionary = new Dictionary();


// -------------------- CHOOSING PRIVATE & PUBLIC KEY ------------------------- \\

let privateKey = fs.readFileSync("./keys/private-key.pem", function (err, data) {
    if (err) throw err;
}).toString();

let publicKey = fs.readFileSync("./keys/public-key.pem", function (err, data) {
    if (err) throw err;
}).toString();


function encrypt(msgString, key) {
    return CryptoJS.AES.encrypt(msgString, key).toString();
}

function decrypt(ciphertextStr, key) {
    return CryptoJS.AES.decrypt(ciphertextStr, key).toString(CryptoJS.enc.Utf8);
}


// -------------------- QUICK SERVER SETUP ------------------------- \\

server.listen(process.env.PORT || 5000); //choose port
console.log('Server listening on port 5000...')
app.use(express.static(__dirname + '/public')); //directory to static files (*.css, *.js)
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
}); //redirect to index.html on main page


// -------------------- EVENTS ------------------------- \\
io.sockets.on('connection', function (socket) {

    socket.on('connection-request', function (json) {
        let encryptedSymmetricKey = json['encryptedSymmetricKey'];
        let decryptor = new JSEncrypt();
        decryptor.setPrivateKey(privateKey);
        let decryptedSymmetricKey = decryptor.decrypt(encryptedSymmetricKey);

        socketKeyDictionary.add(socket.id, decryptedSymmetricKey); //add socket.id to sockets' list

        io.emit('connection-response', {message: 'User connected'})
    });
    socket.on('message-request', function (json) {
        let message = json['message'];
        let messageText = message.toString();
        let decryptedMessageText = decrypt(messageText, socketKeyDictionary.get(socket.id));
        json['message'] = decryptedMessageText;
        socketKeyDictionary.encryptAndEmit(json)
    });

    socket.on('disconnect', function () {
        socketKeyDictionary.remove(socket.id)
        socketKeyDictionary.viewAll()
    })
});
