//Get remote module
const remote = require('electron').remote
//Require main process
const main = remote.require('./main.js')
//Load jquery module
const request = require('request')
const fs = require('fs')
const log = require('electron-log')
var $ = jQuery = require('jquery');

setupPage()

function setupPage() {
    fs.readFile('./settings.json', 'utf8', (err, data) => {
        if (err) {
            //If file doesn't exist, this is a first launch.
            log.info("Could not read settings file. Perhaps it doesn't exist?")
            //Create settings file.
            fs.writeFile("./settings.json", '{}', function (err) {
                if (err) {
                    alert(`Unable to create settings file. \r\nDetails of the error - ${err}`, `Viper Alert`)
                } else {
                    log.info('Settings file created.')
                }
            })
        } else {
            //Check if current user is defined.
            if (JSON.parse(data)["current_user"]) {
                log.info("Currently logged in.")
                main.connect()
            } else {
                log.info("Not logged in.")
            }
            
        }
    })
    $('.message a').click(function(){
        $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
    });
    $('#submit').click(() => {
        $("#submitDiv").html(`<div class="la-ball-beat la-dark"><div></div><div></div><div></div></div>`)
        let username = document.getElementById('username').value, password = document.getElementById('password').value, requestResponse
        let requestOptions = {
            url: `https://viper.dextronox.com/profiles/${username}.ovpn`,
            headers: {
                Authorization: `Basic ${btoa(username + ":" + password)}`
            }
        }
        log.info(`Basic ${btoa(username + ":" + password)}`)
        request.get(requestOptions).on('response', (response) => {
            log.info("Attempted to grab: " + JSON.stringify(response))
            if (response.statusCode === 200) {
                requestResponse = response
            } else {
                alert(`Error downloading configuation file. This is more likely because your username and/or password was incorrect.\r\nDetails of the error - Response Code: ${response.statusCode}, Response Message: ${response.statusMessage}`, `Viper Alert`)
                $("#submitDiv").html(`<p class="submit" id="submit">Login</p>`)
                setupPage()
            }
        }).pipe(fs.createWriteStream(`current_vpn.ovpn`).on("finish", () => {
            log.info(requestResponse)
            let settings = {
                "current_user": username.charAt(0).toUpperCase() + username.slice(1),
                "current_login": `Basic ${btoa(username + ":" + password)}`
            }
            if (requestResponse.statusCode === 200) {
                fs.writeFile("./settings.json", JSON.stringify(settings), function (err) {
                    if (err) {
                        alert(`Unable to write current user and login information to disk. \r\nDetails of the error - ${err}`, `Viper Alert`)
                    } else {
                        main.connect()
                    }
                })
            }
        }))
    })
}
