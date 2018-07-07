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

setupDisplay()

function setupDisplay() {
    fs.readFile('./current_user.txt', function read(err, data) {
        if (err) {
            log.error(error)
            $(".viper-header").html(`Hello.`)
            setupEventListeners()
        } else {
            $(".viper-header").html(`Hello, ${data}`)
            setupEventListeners()
        }
    })
}


function setupEventListeners () {
    
}

$("#install").click(() => {
    require('electron').shell.openExternal("https://openvpn.net/index.php/open-source/downloads.html")
})
    