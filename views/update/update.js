window.Bootstrap = require('bootstrap')
//Get remote module
const remote = require('electron').remote
//Require main process
const main = remote.require('./main.js')
//Non elevated
const cmd = require('node-cmd')
//Elevated
const sudo = require('sudo-prompt');
const fs = require('fs')
const request = require('request')
const progress = require('request-progress');
const log = require('electron-log')
const os = require('os')
//Update
const exec = require('child_process').execFile;
var executablePath = "./new_build.exe";
var $ = jQuery = require('jquery');

setupDisplay()

function setupDisplay() {
    fs.unlink("./update.exe", (err) => {
        if (err) {
            log.error("Unable to delete update.exe. This is probably good.")
        } else {
            log.info("Update.exe was deleted. Client has been previously updated.")
        }
    })
    $("#download").css("display", "block")
    $("#run").css("display", "none")
    $("#downloadButton").click(() => {
        downloadUpdate()
    })
    $("#runButton").click(() => {
        runUpdate()
    })

    setupEventListeners()

}

function downloadUpdate() {
    log.info(`Downloading setup for OS: ${os.arch()}`)
    $("#downloadButton").replaceWith(`<p>Downloading new version. Please wait patiently.</p><div class="progress"><div class="progress-bar" id="downloadProgress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>`)
    let requestConfig = {
        url: 'https://viper.dextronox.com/ver/',
        method: 'GET',
    }
    let version
    request(requestConfig, (err, response, body) => {
        if (err) {
            log.error("Could not get latest version.")
        }
        version = body
        progress(request(`https://viper.dextronox.com/builds/${version}/${os.arch()}.exe`), {}).on('progress', (state) => {
            log.info(`Status: ${state.percent}`)
            $('#downloadProgress').css('width', `${state.percent * 100}%`)
        }).on('error', (err) => {
            log.error(`Error downloading update: ${err}`)
        }).on('end', () => {
            $("#run").css("display", "block")
            $("#download").css("display", "none")
        }).pipe(fs.createWriteStream('./new_build.exe'))
    })
}

function runUpdate() {
    log.info("Beginning update.")
    let close = 0
    exec(executablePath, (err, data) => {
        if (err) {
            log.error(`Could not run update.exe. Error: ${err}`)
            alert(`Could not complete the update. ${err}`, `Viper Alert`)
            close = 1
            setupDisplay()
        }     
    })
    setTimeout(() => {
        if (close === 0) {
            window.close()
        }
    }, 500)

}

function setupEventListeners () {
    $("#return").click(() => {
        main.connect()
    })
}