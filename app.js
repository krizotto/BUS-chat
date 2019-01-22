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
        console.log('List of dict')
        for (var key in this.data) {
            console.log(key + " -> " + this.data[key]);
        }
        console.log('\n-------------------')
    };
    this.myemit = function (json) {
        let myMessage = json['message']
        for (let key in this.data) {
            console.log('My message: ' + myMessage)
            let encMess = encrypt(myMessage, this.get(key))
            console.log('EncMes: ' + encMess)
            json['message'] = encMess
            io.to(key).emit('message-response', json)
        }
    }
}

let dict = new Dictionary();





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
        console.log('***********************************\n')
        console.log('Socket <' + socket.id + '> connected!')
        let encryptedSymmetricKey = json['encryptedSymmetricKey'];
        console.log("Encrypted symmetric key: " + encryptedSymmetricKey);
        let decryptor = new JSEncrypt();
        decryptor.setPrivateKey(privateKey);
        let decryptedSymmetricKey = decryptor.decrypt(encryptedSymmetricKey);
        console.log('Decrypted symmetric key: ' + decryptedSymmetricKey);

        dict.add(socket.id, decryptedSymmetricKey); //add socket.id to sockets' list
        dict.viewAll()

        io.emit('connection-response', {message: 'User connected'})
    })

    socket.on('message-request', function (json) {
        let mystring = json['message']
        let m = mystring.toString()
        console.log('Encrypted message: ' + mystring + '\nSocket.id: ' + socket.id)
        console.log('Key: ' + dict.get(socket.id))

        console.log('Before decryption: '+ m)
        let mes = decrypt(m, dict.get(socket.id))
        console.log('After decryption: ' + mes)
        json['message'] = mes
        
        dict.myemit(json) //function sending to others with theit keys
    })

    socket.on('disconnect', function () {
        dict.remove(socket.id)
        dict.viewAll()
    })
});
