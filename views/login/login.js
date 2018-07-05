//Get remote module
const remote = require('electron').remote
//Require main process
const main = remote.require('./main.js')
//Load jquery module
const request = require('request')
const fs = require('fs')
var $ = jQuery = require('jquery');

setupEventListeners()

function setupEventListeners() {
    $('.message a').click(function(){
        $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
    });
    $('#submit').click(() => {
        $("#submitDiv").html(`<div class="la-ball-beat la-dark"><div></div><div></div><div></div></div>`)
        let username = document.getElementById('username').value, password = document.getElementById('password').value, requestResponse
        let requestOptions = {
            url: `http://139.99.198.205/profiles/${username}.ovpn`,
            headers: {
                Authorization: `Basic ${btoa(username + ":" + password)}`
            }
        }
        console.log(`Basic ${btoa(username + ":" + password)}`)
        request.get(requestOptions).on('response', (response) => {
            console.log("Attempted to grab: " + JSON.stringify(response))
            if (response.statusCode === 200) {
                requestResponse = response
            } else {
                alert(`Error downloading configuation file. This is more likely because your username and/or password was incorrect.\r\nDetails of the error - Response Code: ${response.statusCode}, Response Message: ${response.statusMessage}`, `Viper Alert`)
                $("#submitDiv").html(`<p class="submit" id="submit">Login</p>`)
                setupEventListeners()
            }
        }).pipe(fs.createWriteStream(`current_vpn.ovpn`).on("finish", () => {
            console.log(requestResponse)
            if (requestResponse.statusCode === 200) {
                fs.writeFile("./current_user.txt", username.charAt(0).toUpperCase() + username.slice(1), function (err) {
                    if (err) {
                        alert(`Unable to write current user information to disk. \r\nDetails of the error - ${err}`, `Viper Alert`)
                    } else {
                        fs.writeFile('./current_login.txt', `Basic ${btoa(username + ":" + password)}`, (err) => {
                            if (err) {
                                alert(`Unable to write current login information to disk. \r\nDetails of the error - ${err}`, `Viper Alert`)
                            } else {
                                main.login()
                            }
                        })
                    }
                })
            }
        }))
    })
}
