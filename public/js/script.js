//Locals
let this_usr;
let socket = io.connect('http://' + document.domain + ':' + location.port);
var key = CryptoJS.enc.Utf8.parse('1234567890123456');
console.log('ssij paue')
function encrypt(msgString, key) {
    // msgString is expected to be Utf8 encoded
    var iv = CryptoJS.lib.WordArray.random(16);
    var encrypted = CryptoJS.AES.encrypt(msgString, key, {
        iv: iv
    });
    return iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
}

function decrypt(ciphertextStr, key) {
    var ciphertext = CryptoJS.enc.Base64.parse(ciphertextStr);

    // split IV and ciphertext
    var iv = ciphertext.clone();
    iv.sigBytes = 16;
    iv.clamp();
    ciphertext.words.splice(0, 4); // delete 4 words = 16 bytes
    ciphertext.sigBytes -= 16;

    // decryption
    var decrypted = CryptoJS.AES.decrypt({ciphertext: ciphertext}, key, {
        iv: iv
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

socket.on('connect', function () {
    socket.emit('connection-established', {
        data: 'User Connected'
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



            // var key = "6Le0DgMTAAAAANok"; //length=22
            // var iv  = "mHGFxENnZLbienLy"; //length=22
            //
            // key = CryptoJS.enc.Base64.parse(key);
            //
            // iv = CryptoJS.enc.Base64.parse(iv);



            let my_input = encrypt(user_input,key);

           // user_input = CryptoJS.AES.encrypt(user_input, key).toString();

            console.log("message after decryption: " + user_input);

            socket.emit('my event', {
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

socket.on('my response', function (msg) {

            // var key = "6Le0DgMTAAAAANok"; //length=22
            // var iv  = "mHGFxENnZLbienLy"; //length=22
            //
            // key = CryptoJS.enc.Base64.parse(key);
            // iv = CryptoJS.enc.Base64.parse(iv);

    console.log(msg)

    $('h3').remove()

    let user = decodeURIComponent(escape(msg.user_name));
    let message = decodeURIComponent(escape(msg.message));

    console.log("message before decryption: " + message);
    // let bytes = CryptoJS.AES.decrypt(message, key, { iv: iv });
    // //let bytes = CryptoJS.AES.decrypt(message.toString(), key);
    // let mymessage = bytes.toString(CryptoJS.enc.Utf8);
    let mymessage = decrypt(message,key);
    //Adding message bubbles
    if (user == this_usr) { //my bubbles
        $('p.me-sign').remove()
        $('ul.mess').append('<li class="me">' + mymessage + '</li><br><p class="me-sign">' + user + '</p>')
    } else { //other bubbles
        $('p.him-sign').remove()
        $('ul.mess').append('<li class="him">' + mymessage + '</li><br><p class="him-sign">' + user + '</p>')
    }
})

socket.on('my connection', function (msg) {
    console.log(msg)
})



