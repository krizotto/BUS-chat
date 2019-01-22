let express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    CryptoJS = require('crypto-js');

//RedisStore = require('connect-redis')(session);
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
        console.log('List of dict')
        for (var key in this.data) {
            console.log(key + " -> " + this.data[key]);
        }
        console.log('\n-------------------')
    };
    this.myemit = function (json) {
        for (let key in this.data) {
            let myMessage = 'hello'
            console.log('My message: ' + myMessage)
            let encMess = encrypt(myMessage, this.get(key))
            console.log('EncMes: ' + encMess)
            json['message'] = encMess
            io.to(key).emit('message-response', json)
        }
    }
}

let dict = new Dictionary();


let key = CryptoJS.enc.Utf8.parse('1234567890123456');
console.log('Server listening on port 5000...')

let fs = require("fs");

let privateKey = fs.readFileSync("./keys/private-key.pem", function (err, data) {
    if (err) throw err;
}).toString();

let publicKey = fs.readFileSync("./keys/public-key.pem", function (err, data) {
    if (err) throw err;
}).toString();


const JSEncrypt = require('node-jsencrypt');

const jsEncrypt = new JSEncrypt();

function encrypt(msgString, key) {
    return CryptoJS.AES.encrypt(msgString, key).toString();
}

function decrypt(ciphertextStr, key) {
    return CryptoJS.AES.decrypt(ciphertextStr, key).toString(CryptoJS.enc.Utf8);
}



//events
server.listen(process.env.PORT || 5000); //choose port

app.use(express.static(__dirname + '/public')); //directory to static files (*.css, *.js)
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
}); //redirect to index.html on main page

function myEmit(message) {
    for (let key in this.data) {
    }
}


io.sockets.on('connection', function (socket) {

    socket.on('connection-request', function (json) {
        console.log('***********************************\n')
        console.log('Socket ' + socket.id + ' connected!')
        console.log("Socket connected.");
        let encryptedSymmetricKey = json['encryptedSymmetricKey'];
        console.log("Encrypted symmetric key: " + encryptedSymmetricKey);
        let decryptor = new JSEncrypt();
        decryptor.setPrivateKey(privateKey);
        let decryptedSymmetricKey = decryptor.decrypt(encryptedSymmetricKey);
        console.log('Decrypted symmetric key: ' + decryptedSymmetricKey);

        console.log('This user: ' + socket.id)
        dict.add(socket.id, decryptedSymmetricKey);
        dict.viewAll()

        io.emit('connection-response', {message: 'User connected'})
    })

    socket.on('message-request', function (json) {
        let mystring = json['message']
        let m = mystring.toString()
        console.log('Encrypted message: ' + mystring + '\nSocket.id: ' + socket.id)
        console.log('Pass: ' + dict.get(socket.id))


        let mes = decrypt(m, dict.get(socket.id))
        console.log('the mes: ' + mes)
        json['message'] = mes
        dict.myemit(json)


    })

    socket.on('disconnect', function () {
        dict.remove(socket.id)
        dict.viewAll()
    })
});
