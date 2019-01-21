//Locals
let this_usr;
let socket = io.connect('http://' + document.domain + ':' + location.port);
let key = CryptoJS.enc.Utf8.parse('1234567890123456');
console.log("Generated symmetric key:" + key.toString());

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

socket.on('connect', function () {
    let generated_key = key.toString();
    var encryptor = new JSEncrypt(); // https://github.com/travist/jsencrypt
    // tu taki hardkod troche brzydki, ale na razie nie mam pomyslu jak ladniej to przekazac zeby bylo w miare latwo. wydaje mi sie ze na projekt jest ok
    let server_publickey = "-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtNFOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4gwQco1KRMDSmXSMkDwIDAQAB-----END PUBLIC KEY-----";
    encryptor.setPublicKey(server_publickey);

    let encryptedSymmetricKey = encryptor.encrypt(generated_key);

    socket.emit('connection-request', {
        data: 'User Connected',
        encryptedSymmetricKey: encryptedSymmetricKey
    })

    let form = $('form').on('submit', function (e) {

        e.preventDefault()

        let user_name = $('input.username').val()
        let user_input = $('input.message').val()

        //Set fields to 'alert' mode while empty
        $('#message').removeClass("alert alert-danger")
        $('#username').removeClass("alert alert-danger")

        if (user_name !== '' && user_input != '') {
            this_usr = user_name

            let my_input = encrypt(user_input,key).toString();

            console.log("message after decryption: " + user_input);

            socket.emit('message-request', {
                user_name: user_name,
                message: my_input
            })

            $('input.message').val('').focus()
            if (user_name !== undefined) document.getElementById("username").disabled = true;

        } else {
            if (user_input == undefined)
                $('#message').addClass("alert alert-danger")
            if (user_name == undefined)
                $('#username').addClass("alert alert-danger")
        }
    })
})

socket.on('message-response', function (msg) {

    console.log(msg)
    $('h3').remove()

    let user = decodeURIComponent(escape(msg.user_name));
    let message = decodeURIComponent(escape(msg.message));

    console.log("message before decryption: " + message);

    let mymessage = decrypt(message,key);

    //Adding message bubbles
    if (user == this_usr) { //my bubbles
        $('p.me-sign').remove() //remove prev signature
        $('ul.mess').append('<li class="me">' + mymessage + '</li><br><p class="me-sign">' + user + '</p>')
    } else { //other bubbles
        $('p.him-sign').remove() //remove prev signature
        $('ul.mess').append('<li class="him">' + mymessage + '</li><br><p class="him-sign">' + user + '</p>')
    }
})

socket.on('connection-response', function (msg) {
    console.log(msg)
})



