//Get remote module
const remote = require('electron').remote
//Require main process
const main = remote.require('./main.js')
window.Bootstrap = require('bootstrap')
const ipcRenderer = require('electron').ipcRenderer
//Non elevated
const cmd = require('node-cmd')
//Elevated
const sudo = require('sudo-prompt');
const fs = require('fs')
const request = require('request')
const log = require('electron-log')
const os = require('os')
var $ = jQuery = require('jquery');
var options = {
    name: 'Viper'
}
const swal = require("sweetalert")
let ovpnPath

environmentCheck()

function environmentCheck() {
    if (os.arch() === "x64") {
        ovpnPath = `C:\\Program Files\\OpenVPN\\bin`
        log.info(`OpenVPN directory set to ${ovpnPath}`)
    } else if (os.arch() === "ia32") {
        ovpnPath = "C:\\Program Files (x86)\\OpenVPN\\bin"
        log.info(`OpenVPN directory set to ${ovpnPath}`)
    } else {
        log.error("Arch check fail")
    }
    //This is technically a display thing, but it doesn't need to run everytime a button is clicked.
    $("#version").html(`${remote.app.getVersion()}`)
    let requestConfig = {
        url: `https://viper.dextronox.com/ver/?${Math.floor(Math.random() * Math.floor(300))}`,
        method: 'GET',
    }
    request(requestConfig, (err, response, body) => {
        log.info(`Local version for comparison: ${parseFloat(remote.app.getVersion())}`)
        log.info(`Remote version for comparison: ${parseFloat(body)}`)
        log.info(`Newest version: ${parseFloat(body) <= parseFloat(remote.app.getVersion())}`)
        if (err) {
            log.error("Unable to get latest version number.")
            $("#version").append(` (<a href="#" style="color:black" id="logout">Logout</a>)`)
            $("#logout").click(() => {
                logout()
            })
        }
        if (parseFloat(body) > parseFloat(remote.app.getVersion())) {
            $("#version").append(` (<a href="#" style="color:black" id="update">Update Available</a>)`)
            $("#version").append(` (<a href="#" style="color:black" id="logout">Logout</a>)`)
            $("#update").click(() => {
                main.update()
            })
            $("#logout").click(() => {
                logout()
            })
            swal({
                title: "Update Available",
                text: "A new version of Viper is available. Whilst it is not necessary to update, new versions improve user experience and add functionality.",
                icon: "warning",
                buttons: {
                    ignore: {
                        text: "Ignore",
                        closeModal: true,
                        className: "swal-button--cancel",
                        value: null
                    },
                    update: {
                        text: "Update",
                        closeModal: false
                    }
                }
            }).then(willUpdate => {
                if (willUpdate) {
                    //Update
                    log.info("Updating.")
                    main.update()
                } else {
                    log.info("Not updating.")
                }
            })
        } else {
            $("#version").append(" (Latest Version)")
            $("#version").append(` (<a href="#" style="color:black" id="logout">Logout</a>)`)
            $("#logout").click(() => {
                logout()
            })
        }
    })
    //Check VPN file exists
    fs.readFile('./current_vpn.ovpn', 'utf8', (err) => {
        if (err) {
            swalAlert(`Error`, 'Could not read VPN configuration file. Application will now logout.', 'error')
            log.error(`current_vpn.ovpn not found. Error: ${err}`)
            logout()
        }
    })

    fs.readFile('./settings.json', 'utf8', (err, data) => {
        if (err) {
            swalAlert(`Error`, `Could not read settings file. Error: ${err}`, `error`)
        } else {
            if (!JSON.parse(data)["current_user"] || !JSON.parse(data)["current_login"]) {
                swalAlert(`Error`, 'current_user or current_login is not defined. Application will now logout.', 'error')
                log.error(`current_user or current_login is not defined.`)
                logout()
            } else {
                log.info("Environment check complete.")
            }
        }

    })
    cmd.get(`"${ovpnPath}\\openvpn.exe" --version`, (err, data, stderr) => {
        if (!data.includes("built on")) {
            log.info(`No OpenVPN install found at "${ovpnPath}\\openvpn.exe"`)
            log.info(data)
            main.alert()
        } else {
            log.info("OpenVPN install found!")
            setupDisplay()
        }
    })
}

function setupDisplay() {
    fs.readFile('./settings.json', function read(err, data) {
        if (err) {
            log.error(error)
            $(".viper-header").html(`Hello.`)
        } else {
            $(".viper-header").html(`Hello, ${JSON.parse(data)["current_user"]}`)
        }
    })
    cmd.get('tasklist', (error, data, stderr) => {
        if (error) {
            log.error(error)
            swalAlert(`Error`, `Unable to check whether OpenVPN is running.`, `error`)
            $("#connection").append("<p>Viper should be restarted</p>")
        } else if (data.includes("openvpn.exe")) {//OpenVPN process is running, therefore a VPN must be connected
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
    $("#connect").click(function() {
        log.info("Connect clicked")
        $("#connection").html(`<center><div class="la-ball-beat la-dark la-3x"><div></div><div></div><div></div></div></center>`)
        cmd.get('tasklist', (error, data, stderr) => {
            if (error) {
                log.error(error)
                $("#connection").html(`<p>${error}</p>`)
            } else if (data.includes("openvpn.exe")) {
                setupDisplay()
            } else {
                sudo.exec(`"${ovpnPath}\\openvpn.exe" --config current_vpn.ovpn`, options, (error, stdout, stderr) => {
                    if (error) {
                        log.error(error)
                        if (warning === 0) {
                            swalAlert(`Error`, "The VPN failed to connect. This is either because you didn't grant permission, or Viper was unable to complete the connection. This error could also have been triggered by you disconnecting within 30 seconds of initially connecting, in which case you can ignore this alert.", "error")
                            setupDisplay()
                        }
                    }
                    log.info(stdout)
                })
                setTimeout(function() {
                    ipcRenderer.send('networkCheck', 1)
                    setupDisplay()
                }, 5000)
                setTimeout(function() {
                    warning = 1
                    log.info("Now assuming connected")
                }, 45000) 
            }
        })

    })
    
    $("#disconnect").click(function() {
        log.info("Disconnect clicked")
        $("#connection").html(`<center><div class="la-ball-beat la-dark la-3x"><div></div><div></div><div></div></div></center>`)
        sudo.exec('taskkill /IM openvpn.exe /F', options, (error, stdout, stderr) => {
            if (error) {
                log.error(error)
                swalAlert(`Error`, `An error occurred whilst trying to disconnect. Error: ${error}`, `error`)
            }
            log.info(stdout)
            ipcRenderer.send('networkCheck', 0)
            setupDisplay()
        })
    })

    $("#vipermobilesubmit").click(function() {
        let settings_data, current_email_data = $("#vipermobileemail").val()
        log.info("Viper for Mobile submit clicked")
        log.info($("#vipermobileemail").val())
        $("#vipermobile").html(`<center><div class="la-ball-beat la-dark la-2x"><div></div><div></div><div></div></div></center>`)
        fs.readFile('./settings.json', "utf8", function read(err, data) {
            if (err) {
                //Unable to read settings file
            } else {
                settings_data = JSON.parse(data)
                log.info(data)
                current_login_data = data
                let requestConfig = {
                    url: 'https://viper.dextronox.com/api/mobile',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    json: {
                        "Name":settings_data["current_user"],
                        "Login":settings_data["current_login"],
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
                })
            }
        })
    })
}

function logout() {
    fs.writeFile('./settings.json', '{}', (err) => {
        if (err) {
            swalAlert(`Error`, `There was an error logging out. To ensure stability, Viper will now close. This error was caused by the settings.json file being unwritable.`, `error`)
            main.app.quit()
        }
        main.login()
    })
}

function swalAlert(title, body, icon) {
    swal({
        title: title,
        text: body,
        icon: icon,
        buttons: {
            ignore: {
                text: "Okay",
                closeModal: true,
                className: "swal-button--cancel",
                value: null
            }
        }
    })
}