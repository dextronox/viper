const path = require('path')
//Get remote module
const remote = require('electron').remote
//Require main process
const getCurrentWindow = require('electron').remote.getCurrentWindow
const main = remote.require(path.resolve(__dirname, '../..', 'main.js'))
window.Bootstrap = require('bootstrap')
const ipcRenderer = require('electron').ipcRenderer
//Non elevated
const cmd = require('node-cmd')
const fs = require('fs')
const request = require('request')
const log = require('electron-log')
const os = require('os')
var $ = jQuery = require('jquery');
const swal = require("sweetalert")
let ovpnPath

environmentSetup()

function environmentSetup() {
    ipcRenderer.on('networkCheckDisconnect', (event, args) => {
        if (args.connection === 1) {
            //Network check disconnected VPN
            setupDisplay()
        } else if (args.connection === 0) {
            //Network check failed to disconnected VPN
            setupDisplay()
        }
    })
    ipcRenderer.on('connectionLost', (event, args) => {
        if (args.connection === 1) {
            //Should never be called
            setupDisplay()
        } else if (args.connection === 0) {
            //Refreshes display
            setupDisplay()
        }
    })
    $("#vipermobilesubmit").click(() => {
        mobileSubmit()
    })
    $("#viper-logo").click(() => {
        getCurrentWindow().reload()
    })
    //This is technically a display thing, but it doesn't need to run everytime a button is clicked.
    let requestConfigAlert = {
        url: `https://viper.dextronox.com/alerts/connectWindowAlert?${Math.floor(Math.random() * Math.floor(300))}`,
        method: 'GET',
    }
    request(requestConfigAlert, (err, response, body) => {
        if (err || response.statusCode != 200) {
            log.error(`Unable to get connectWindowAlert.html. It's possible it doesn't exist, which is fine. Error: ${err}`)
        } else if (body) {
            log.info(`Alert message set to: ${body}`)
            $("#alertMessageDivider").css('display', 'block')
            $("#alertMessage").html(body)
        } else {
            log.info(`No alert message to display.`)
        }
    })
    $("#version").html(`${remote.app.getVersion()}`)
    let requestConfigVersion = {
        url: `https://viper.dextronox.com/ver/?${Math.floor(Math.random() * Math.floor(300))}`,
        method: 'GET',
    }
    request(requestConfigVersion, (err, response, body) => {
        log.info(`Local version for comparison: ${parseFloat(remote.app.getVersion())}`)
        log.info(`Remote version for comparison: ${parseFloat(body)}`)
        log.info(`Newest version: ${parseFloat(body) <= parseFloat(remote.app.getVersion())}`)
        if (err) {
            log.error(`Unable to get latest version number. Error: ${err}`)
            $("#version").html(`${remote.app.getVersion()} (<a href="#" style="color:black" id="logout">Logout</a>)`)
            $("#logout").click(() => {
                logout()
            })
        } else if (parseFloat(body) > parseFloat(remote.app.getVersion())) {
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
    fs.readFile(path.resolve(__dirname, '../..', 'current_vpn.ovpn'), 'utf8', (err) => {
        if (err) {
            swalAlert(`Error`, 'Could not read VPN configuration file. Application will now logout.', 'error')
            log.error(`current_vpn.ovpn not found. Error: ${err}`)
            logout()
        }
    })

    fs.readFile(path.resolve(__dirname, '../..', 'settings.json'), 'utf8', (err, data) => {
        if (err) {
            swalAlert(`Error`, `Could not read settings file. Error: ${err}`, `error`)
        } else {
            if (!JSON.parse(data)["current_user"] || !JSON.parse(data)["current_login"]) {
                swalAlert(`Error`, 'current_user or current_login is not defined. Application will now logout.', 'error')
                log.error(`current_user or current_login is not defined.`)
                logout()
            } else {
                log.info("Settings check complete.")
            }
        }

    })
    setupDisplay()
}

function setupDisplay() {
    $("img").on('dragstart', function(event) { event.preventDefault(); });
    fs.readFile(path.resolve(__dirname, '../..', 'settings.json'), function read(err, data) {
        if (err) {
            log.error(error)
            $(".viper-header").html(`Hello.`)
        } else {
            $(".viper-header").html(`Hello, ${JSON.parse(data)["current_user"]}`)
        }
    })
    ipcRenderer.send('checkIfConnected')
    ipcRenderer.once('checkIfConnected', (event, args) => {
        if (args.connected === true) {
            log.info("OpenVPN is currently connected.")
            $("#connection").html('<button id="disconnect" type="button" class="btn btn-danger btn-lg btn-block connectdisconnect">Disconnect</button>')
            $("#connection").append(`<p class="message">It may take a couple seconds to finish connecting. If the VPN doesn't appear to be working, feel free to click disconnect and then reconnect.</p>`)
            setupEventListeners()
        } else {
            log.info("OpenVPN is currently disconnected.")
            let requestOptions = { 
                method: 'POST',
                url: 'https://api.uptimerobot.com/v2/getMonitors',
                headers: { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/x-www-form-urlencoded' 
                },
                form: { 
                    api_key: 'm780789416-5ec4543d2598ec46a4cff9a4', 
                    format: 'json', 
                    logs: '1' 
                },
                timeout: 7000
            };
            request(requestOptions, (error, httpResponse, body) => {
                let bodyParse
                if (error) {
                    if (error.code === "ETIMEDOUT") {
                        log.error(`Unable to get uptime data from UptimeRobot because of a timeout. Error: ${error}`)
                        $("#connection").html('<button id="refresh" type="button" class="btn btn-danger btn-lg btn-block connectdisconnect">Refresh</button>')
                        swalAlert('You are Offline', 'You are currently disconnected from the internet. Please connect to the internet before connecting to Viper.', 'error')
                        setupEventListeners()
                    } else {
                        log.error(`An unknown error occurred whilst trying to get data from UptimeRobot. Error: ${error}`)
                        $("#connection").html('<button id="refresh" type="button" class="btn btn-danger btn-lg btn-block connectdisconnect">Refresh</button>')
                        swalAlert('Are You Online?', 'We were unable to determine whether Viper is online. Please check your internet connection and try again.', 'error')
                        setupEventListeners()
                    }
                } else {
                    if (body) {
                        bodyParse = JSON.parse(body)
                        log.info(`Server status from UptimeRobot: ${bodyParse["monitors"][0]["status"]}`)
                    }
                    if (bodyParse["monitors"][0]["status"] === 2) {
                        log.info('Server is online.')
                        $("#connection").html('<button id="connect" type="button" class="btn btn-success btn-lg btn-block connectdisconnect">Connect</button>')
                        setupEventListeners()
                    } else if (bodyParse["monitors"][0]["status"] != 2) {
                        log.info('Server is offline.')
                        $("#connection").html('<button id="refresh" type="button" class="btn btn-danger btn-lg btn-block connectdisconnect">Refresh</button>')
                        swalAlert('Viper is Offline', 'Viper is currently offline. This means we are unable to accept connections to our VPN. The issue should be resolved soon.', 'error')
                        setupEventListeners()
                    }
                }
            })

        }
    })
}


function setupEventListeners () {
    //Runs everytime.
    $('#refresh').click(() => {
        getCurrentWindow().reload()
    })
    $("#connect").click(function() {
        log.info("Connect clicked")
        $("#connection").html(`<center><div class="center la-ball-beat la-3x"><div></div><div></div><div></div></div></center>`)
        ipcRenderer.send('connection', 1)
        ipcRenderer.once('connection', (event, args) => {
            if (args.connection === 1) {
                //Connected
                setupDisplay()
            } else if (args.connection === 0) {
                //Disconnected
                swalAlert(`Error`, `Viper was unable to connect you to our VPN.`, `error`)
                setTimeout(() => {
                    setupDisplay()
                }, 100)
            } else if (args.connection === 2) {
                //Another VPN is connected
                swalAlert(`Error`, `Viper was unable to connect you to our VPN because there is another VPN program open. Ensure all other VPNs are closed, and then try to connect.`, `error`)
                setTimeout(() => {
                    setupDisplay()
                }, 100)
            }
        })

    })
    $("#disconnect").click(function() {
        log.info("Disconnect clicked")
        $("#connection").html(`<center><div class="center la-ball-beat la-3x"><div></div><div></div><div></div></div></center>`)
        ipcRenderer.send('connection', 0)
        ipcRenderer.once('connection', (event, args) => {
            if (args.connection === 1) {
                //Connected
                swalAlert(`Error`, `Viper was unable to disconnect you from our VPN.`, `error`)
                setupDisplay()
            } else if (args.connection === 0) {
                //Disconnected
                setupDisplay()
            }
        })
    })
}

function logout() {
    ipcRenderer.send('checkIfConnected')
    ipcRenderer.once('checkIfConnected', (event, args) => {
        if (args.connected === true) {
            swal({
                title: "Are you sure?",
                text: "You're currently connected to Viper. Logging out will disconnect you and all the security benefits of Viper will be lost.",
                icon: "warning",
                buttons: {
                    ignore: {
                        text: "Stay logged in",
                        closeModal: true,
                        className: "swal-button--cancel",
                        value: null
                    },
                    update: {
                        text: "Continue logging out",
                        closeModal: false
                    }
                }
            }).then(willLogout => {
                if (willLogout) {
                    log.info("User confirmed they want to logout.")
                    ipcRenderer.send('connection', 0)
                    ipcRenderer.once('connection', (event, args) => {
                        if (args.connection === 1) {
                            //Connected
                            swalAlert(`Error`, `Whilst logging out we failed to disconnect you from Viper. Viper will continue to logout, however the VPN may remain connected. Realistically, you should never see this error message. If you are reading this, something has gone horribly, horribly wrong. Try killing openvpn.exe with task manager if the VPN remains connected.`, `error`)
                            main.login()
                        } else if (args.connection === 0) {
                            //Disconnected
                            fs.writeFile(path.resolve(__dirname, '../..', 'settings.json'), '{}', (err) => {
                                if (err) {
                                    swalAlert(`Error`, `There was an error logging out. To ensure stability, Viper will now close. This error was caused by the settings.json file being unwritable.`, `error`)
                                    main.app.quit()
                                }
                                main.login()
                            })
                        }
                    })
                } else {
                    log.info("User confirmed they do not want to logout.")
                }
            })
        } else {
            fs.writeFile(path.resolve(__dirname, '../..', 'settings.json'), '{}', (err) => {
                if (err) {
                    swalAlert(`Error`, `There was an error logging out. To ensure stability, Viper will now close. This error was caused by the settings.json file being unwritable.`, `error`)
                    main.app.quit()
                }
                main.login()
            })
        }
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

function mobileSubmit() {
    if ($("#vipermobileemail").val() != "") {
        let settings_data, current_email_data = $("#vipermobileemail").val()
        log.info("Viper for Mobile submit clicked")
        log.info($("#vipermobileemail").val())
        $("#vipermobile").html(`<center><div class="center la-ball-beat la-2x"><div></div><div></div><div></div></div></center>`)
        fs.readFile(path.resolve(__dirname, '../..', 'settings.json'), "utf8", function read(err, data) {
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
                            $("#vipermobilesubmit").click(() => {
                                mobileSubmit()
                            })
                        }, 3000)
                    } else {
                        //Email failed to send
                        $("#vipermobile").html(`<center><p>Email failed to send.</p></center>`)
                        setTimeout(() => {
                            $("#vipermobile").html(`<span><input type="email" id="vipermobileemail" name="email" class="email_form" placeholder="name@example.com" required></span><span><input type="submit" class="btn btn-success email_submit" id="vipermobilesubmit"></span>`)
                            $("#vipermobilesubmit").click(() => {
                                mobileSubmit()
                            })
                        }, 3000)
                    }
                })
            }
        })
    } else  {
        swalAlert('Error', 'Please supply an email address.', 'error')
        $("#vipermobile").html(`<center><p>Email failed to send.</p></center>`)
        setTimeout(() => {
            $("#vipermobile").html(`<span><input type="email" id="vipermobileemail" name="email" class="email_form" placeholder="name@example.com" required></span><span><input type="submit" class="btn btn-success email_submit" id="vipermobilesubmit"></span>`)
            $("#vipermobilesubmit").click(() => {
                mobileSubmit()
            })
        }, 3000)
    }
}