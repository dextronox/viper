window.Bootstrap = require('bootstrap')
//Get remote module
const remote = require('electron').remote
//Require main process
const main = remote.require(path.resolve(__dirname, '../..', 'main.js'))
//Non elevated
const path = require('path')
const cmd = require('node-cmd')
//Elevated
const sudo = require('sudo-prompt');
const fs = require('fs')
const request = require('request')
const progress = require('request-progress');
const log = require('electron-log')
const os = require('os')
const swal = require("sweetalert")
//Update
const exec = require('child_process').execFile;
var executablePath = path.resolve(__dirname, '../..', 'new_build.exe');
var $ = jQuery = require('jquery');

setupDisplay()

function setupDisplay() {
    fs.unlink(path.resolve(__dirname, '../..', 'update.exe'), (err) => {
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
            swalAlert(`Error`, `We were not able to retrieve the latest version number of Viper. This is most likely due to network connectivity issues. This error does NOT mean we failed to download the newest installer, as we didn't get to that stage.`, `error`)
            setupDisplay()
        }
        version = body
        progress(request(`https://viper.dextronox.com/builds/${version}/${os.arch()}.exe`), {}).on('progress', (state) => {
            log.info(`Status: ${state.percent}`)
            $('#downloadProgress').css('width', `${state.percent * 100}%`)
        }).on('error', (err) => {
            log.error(`Error downloading update: ${err}`)
            swalAlert(`Error`, `We were not able to download the latest version of Viper. This is most likely due to network connectivity issues.`, `error`)
            setupDisplay()
        }).on('end', () => {
            $("#run").css("display", "block")
            $("#download").css("display", "none")
        }).pipe(fs.createWriteStream(path.resolve(__dirname, '../..', 'new_build.exe')))
    })
}

function runUpdate() {
    log.info("Beginning update.")
    let close = 0
    exec(executablePath, (err, data) => {
        if (err) {
            log.error(`Could not run new_build.exe. Error: ${err}`)
            swalAlert(`Error`, `Could not open the update executable. ${err}`, `error`)
            close = 1
            setupDisplay()
        } else {
            window.close()
        }
    })

}

function setupEventListeners () {
    $("#return").click(() => {
        main.connect()
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