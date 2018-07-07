//Get remote module
const remote = require('electron').remote
//Require main process
const main = remote.require('./main.js')
window.Bootstrap = require('bootstrap')
//Non elevated
const cmd = require('node-cmd')
//Elevated
const sudo = require('sudo-prompt');
const fs = require('fs')
const request = require('request')
const log = require('electron-log')
var $ = jQuery = require('jquery');
var options = {
    name: 'Viper'
}

environmentCheck()

function environmentCheck() {
    //Check current user exists
    fs.readFile('./current_user.txt', 'utf8', (err) => {
        if (err) {
            fs.unlink('./current_login.txt', (err) => {
                if (err) {
                    alert(`Whilst performing an environment check, we found that the file "current_user.txt" did not exist. We were unable to form a clean login by deleting "current_login.txt". It's probably best to reinstall Viper.`, `Viper Alert`)
                }
                main.login()
            })
            fs.unlink('./current_vpn.ovpn', (err) => {
                if (err) {
                    alert(`Whilst performing an environment check, we found that the file "current_user.txt" did not exist. We were unable to form a clean login by deleting "current_vpn.ovpn". It's probably best to reinstall Viper.`, `Viper Alert`)
                }
                main.login()
            })
        }
    })
    //Check VPN file exists
    fs.readFile('./current_vpn.ovpn', 'utf8', (err) => {
        if (err) {
            fs.unlink('./current_login.txt', (err) => {
                if (err) {
                    alert(`Whilst performing an environment check, we found that the file "current_vpn.ovpn" did not exist. We were unable to form a clean login by deleting "current_login.txt". It's probably best to reinstall Viper.`, `Viper Alert`)
                }
                main.login()
            })
            fs.unlink('./current_user.txt', (err) => {
                if (err) {
                    alert(`Whilst performing an environment check, we found that the file "current_vpn.ovpn" did not exist. We were unable to form a clean login by deleting "current_user.txt". It's probably best to reinstall Viper.`, `Viper Alert`)
                }
                main.login()
            })
        }
    })
    //Check authentication file exists
    fs.readFile('./current_login.txt', 'utf8', (err) => {
        if (err) {
            fs.unlink('./current_vpn.ovpn', (err) => {
                if (err) {
                    alert(`Whilst performing an environment check, we found that the file "current_login.txt" did not exist. We were unable to form a clean login by deleting "current_vpn.ovpn". It's probably best to reinstall Viper.`, `Viper Alert`)
                }
                main.login()
            })
            fs.unlink('./current_user.txt', (err) => {
                if (err) {
                    alert(`Whilst performing an environment check, we found that the file "current_login.txt" did not exist. We were unable to form a clean login by deleting "current_user.txt". It's probably best to reinstall Viper.`, `Viper Alert`)
                }
                main.login()
            })
        }
    })
    cmd.get('openvpn --version', (err, data, stderr) => {
        if (!data.includes("built on")) {
            log.info("No OpenVPN install found.")
            main.alert()
        } else {
            log.info("OpenVPN install found!")
            setupDisplay()
        }
    })
}

function setupDisplay() {
    $("#version").html(`${remote.app.getVersion()} (<a href="#" style="color:black" id="logout">Logout</a>)`)
    fs.readFile('./current_user.txt', function read(err, data) {
        if (err) {
            log.error(error)
            $(".viper-header").html(`Hello.`)
        } else {
            $(".viper-header").html(`Hello, ${data}`)
        }
    })
    cmd.get('tasklist', (error, data, stderr) => {
        if (error) {
            log.error(error)
            $("#connection").html(`<p>${error}</p>`)
            $("#connection").append("<p>Press CTRL + R to retry.</p>")
        } else if (data.includes("openvpn")) {//OpenVPN process is running, therefore a VPN must be connected
            log.info("OpenVPN is currently connected.")
            $("#connection").html('<button id="disconnect" type="button" class="btn btn-danger btn-lg btn-block connectdisconnect">Disconnect</button>')
            $("#connection").append(`<p class="message">It may take a couple seconds to finish connecting. If the VPN doesn't appear to be working, feel free to click disconnect and then reconnect. You may see an error when disconnecting, which can be ignored.</p>`)
            setupEventListeners()
        } else { //OpenVPN is not running, therefore a VPN must not be connected
            log.info("OpenVPN is currently disconnected.")
            $("#connection").html('<button id="connect" type="button" class="btn btn-success btn-lg btn-block connectdisconnect">Connect</button>')
            setupEventListeners()
        }
    })
}


function setupEventListeners () {
    let warning = 0
    $("#logout").click(() => {
        fs.unlink('./current_login.txt', (err) => {
            if (err) {
                alert(`There was an error logging out. Viper will now close.`, `Viper Alert`)
                main.app.quit()
            }
            main.login()
        })
    })
    $("#connect").click(function() {
        log.info("Connect clicked")
        $("#connection").html(`<center><div class="la-ball-beat la-dark la-3x"><div></div><div></div><div></div></div></center>`)
        sudo.exec(`openvpn --config current_vpn.ovpn`, options, (error, stdout, stderr) => {
            if (error) {
                log.error(error)
                if (warning === 0) {
                    alert("The VPN failed to connect. This is either because you didn't grant permission, or Viper was unable to complete the connection. This error could also have been triggered by you disconnecting within 30 seconds of initially connecting, in which case you can ignore this alert.")
                }
            }
            log.info(stdout)
        })
        setTimeout(function() {
            setupDisplay()
        }, 3000)
        setTimeout(function() {
            warning = 1
            log.info("Now assuming connected")
        }, 45000)
    })
    
    $("#disconnect").click(function() {
        log.info("Disconnect clicked")
        $("#connection").html(`<center><div class="la-ball-beat la-dark la-3x"><div></div><div></div><div></div></div></center>`)
        sudo.exec('taskkill /IM openvpn.exe /F', options, (error, stdout, stderr) => {
            if (error) {
                log.error(error)
                alert("You did not grant permission. The VPN will remain connected.")
            }
            log.info(stdout)
            setupDisplay()
        })
    })

    $("#vipermobilesubmit").click(function() {
        let current_user_data, current_login_data, current_email_data = $("#vipermobileemail").val()
        log.info("Viper for Mobile submit clicked")
        log.info($("#vipermobileemail").val())
        $("#vipermobile").html(`<center><div class="la-ball-beat la-dark la-2x"><div></div><div></div><div></div></div></center>`)
        fs.readFile('./current_user.txt', "utf8", function read(err, data) {
            if (err) {
                //Unable to read current user file
            } else {
                log.info(data)
                current_user_data = data
                fs.readFile('./current_login.txt', "utf8", function read(err, data) {
                    if (err) {
                        //Unable to read current login file
                    } else {
                        log.info(data)
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
                                setTimeout(() => {
                                    $("#vipermobile").html(`<span><input type="email" id="vipermobileemail" name="email" class="email_form" placeholder="name@example.com" required></span><span><input type="submit" class="btn btn-success email_submit" id="vipermobilesubmit"></span>`)
                                    setupEventListeners()
                                }, 3000)
                            } else {
                                //Email failed to send
                                $("#vipermobile").html(`<center><p>Email failed to send.</p></center>`)
                                setTimeout(() => {
                                    $("#vipermobile").html(`<span><input type="email" id="vipermobileemail" name="email" class="email_form" placeholder="name@example.com" required></span><span><input type="submit" class="btn btn-success email_submit" id="vipermobilesubmit"></span>`)
                                    setupEventListeners()
                                }, 3000)
                            }
                            log.info(body)
                            log.info(response)
                        })
                    }
                })
            }
        })
    })
}