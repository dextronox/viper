window.Bootstrap = require('bootstrap')
const sudo = require('sudo-prompt');
const fs = require('fs')
const request = require('request')
var $ = jQuery = require('jquery');
var options = {
    name: 'Viper'
}

setupDisplay()

function setupDisplay() {
    fs.readFile('./current_user.txt', function read(err, data) {
        if (err) {
            console.log(error)
            $(".viper-header").html(`Hello.`)
        } else {
            $(".viper-header").html(`Hello, ${data}`)
        }
    })
    sudo.exec('tasklist', options, (error, stdout, stderr) => {
        if (error) {
            console.log(error)
            $("#connection").html(`<p>${error}</p>`)
            $("#connection").append("<p>Press CTRL + R to retry.</p>")
        } else if (stdout.includes("openvpn")) {//OpenVPN process is running, therefore a VPN must be connected
            console.log("OpenVPN is currently connected.")
            $("#connection").html('<button id="disconnect" type="button" class="btn btn-danger btn-lg btn-block connectdisconnect">Disconnect</button>')
            $("#connection").append(`<p class="message">It may take a couple seconds to finish connecting. If the VPN doesn't appear to be working, feel free to click disconnect and then reconnect.</p>`)
            setupEventListeners()
        } else { //OpenVPN is not running, therefore a VPN must not be connected
            console.log("OpenVPN is currently disconnected.")
            $("#connection").html('<button id="connect" type="button" class="btn btn-success btn-lg btn-block connectdisconnect">Connect</button>')
            setupEventListeners()
        }
    })
}


function setupEventListeners () {
    let warning = 0
    $("#connect").click(function() {
        console.log("Connect clicked")
        $("#connection").html(`<center><div class="la-ball-beat la-dark la-3x"><div></div><div></div><div></div></div></center>`)
        sudo.exec(`openvpn --config current_vpn.ovpn`, options, (error, stdout, stderr) => {
            if (error) {
                console.log(error)
                if (warning === 0) {
                    alert("The VPN failed to connect. This is either because you didn't grant permission, or Viper was unable to complete the connection.")
                }
            }
            console.log(stdout)
        })
        setTimeout(function() {
            setupDisplay()
        }, 3000)
        setTimeout(function() {
            warning = 1
            console.log("Now assuming connected")
        }, 45000)
    })
    
    $("#disconnect").click(function() {
        console.log("Disconnect clicked")
        $("#connection").html(`<center><div class="la-ball-beat la-dark la-3x"><div></div><div></div><div></div></div></center>`)
        sudo.exec('taskkill /IM openvpn.exe /F', options, (error, stdout, stderr) => {
            if (error) {
                console.log(error)
                alert("You did not grant permission. The VPN will remain connected.")
            }
            console.log(stdout)
            setupDisplay()
        })
    })

    $("#vipermobilesubmit").click(function() {
        let current_user_data, current_login_data, current_email_data = $("#vipermobileemail").val()
        console.log("Viper for Mobile submit clicked")
        console.log($("#vipermobileemail").val())
        $("#vipermobile").html(`<center><div class="la-ball-beat la-dark la-2x"><div></div><div></div><div></div></div></center>`)
        fs.readFile('./current_user.txt', "utf8", function read(err, data) {
            if (err) {
                //Unable to read current user file
            } else {
                console.log(data)
                current_user_data = data
                fs.readFile('./current_login.txt', "utf8", function read(err, data) {
                    if (err) {
                        //Unable to read current login file
                    } else {
                        console.log(data)
                        current_login_data = data
                        let requestConfig = {
                            url: 'http://139.99.198.205:3001/mobile',
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            json: {
                                "Name":current_user_data,
                                "Login":current_login_data,
                                "Email":current_email_data
                            }
                        }
                        request(requestConfig, (err, response, body) => {
                            if (response.statusCode === 200) {
                                $("#vipermobile").html(`<center><p>Email sent successfully!</p></center>`)
                            } else {
                                //Email failed to send
                                $("#vipermobile").html(`<center><p>Email failed to send.</p></center>`)
                            }
                            console.log(body)
                            console.log(response)
                        })
                    }
                })
            }
        })
    })
}