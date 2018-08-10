const path = require('path')
window.Bootstrap = require('bootstrap')
//Get remote module
const remote = require('electron').remote
//Require main process
const main = remote.require(path.resolve(__dirname, '../..', 'main.js'))
//Non elevated
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
var executablePath = path.resolve(__dirname, '../..', "ovpninstaller.exe");
var $ = jQuery = require('jquery');
var sudoOptions = {
    name: "Viper"
}

setupDisplay()

function setupDisplay() {
    fs.unlink(path.resolve(__dirname, '../..', 'ovpninstaller.exe'), (err) => {
        if (err) {
            log.error("Unable to delete ovpninstaller.exe. This is probably good.")
        } else {
            log.info("ovpninstaller.exe was deleted. OpenVPN has been previously installed with Viper.")
        }
    })
    $("#download").css("display", "block")
    $("#run").css("display", "none")
    $("#relaunch").css("display", "none")
    $("#downloadButton").click(() => {
        downloadUpdate()
    })
    $("#runButton").click(() => {
        runUpdate()
    })
    $("#relaunchButton").click(() => {
        relaunch()
    })

    setupEventListeners()

}

function downloadUpdate() {
    log.info(`Downloading latest OpenVPN installer.`)
    $("#downloadButton").replaceWith(`<p>Downloading OpenVPN. Please wait patiently.</p><div class="progress"><div class="progress-bar" id="downloadProgress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>`)
    progress(request(`https://build.openvpn.net/downloads/releases/latest/openvpn-install-latest-stable.exe`), {}).on('progress', (state) => {
        log.info(`Status: ${state.percent}`)
        $('#downloadProgress').css('width', `${state.percent * 100}%`)
    }).on('error', (err) => {
        log.error(`Error downloading update: ${err}`)
    }).on('end', () => {
        $("#run").css("display", "block")
        $("#download").css("display", "none")
    }).pipe(fs.createWriteStream(path.resolve(__dirname, '../..', 'ovpninstaller.exe')))
}

function runUpdate() {
    log.info("Beginning update.")
    let close = 0
    sudo.exec(`start ${executablePath}`, sudoOptions, (err, stdout, stderr) => {
        if (err) {
            log.error(`Could not run update.exe. Error: ${err}`)
            swalAlert(`Error`, `Could not complete the installation. ${err}`, `error`)
            remote.getCurrentWindow().reload()
        }
    })
    $("#relaunch").css("display", "block")
    $("#run").css("display", "none")

}

function relaunch() {
    remote.app.relaunch()
    remote.app.quit()
}

function setupEventListeners () {

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