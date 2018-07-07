const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const log = require('electron-log')
const fs = require('fs')
require('update-electron-app')({
    repo: 'dextronox/viper',
    updateInterval: '5 minutes',
    logger: require('electron-log')
})
let loginWindow, connectWindow

// Same as for console transport
log.transports.file.level = 'silly';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
 
// Set approximate maximum log size in bytes. When it exceeds,
// the archived log will be saved as the log.old.log file
log.transports.file.maxSize = 5 * 1024 * 1024;
 
// Write to this file, must be set before first logging
log.transports.file.file = __dirname + '/log.txt';
 
// fs.createWriteStream options, must be set before first logging
// you can find more information at
// https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
log.transports.file.streamConfig = { flags: 'w' };
 
// set existed file stream
log.transports.file.stream = fs.createWriteStream('log.txt');

function createLoginWindow () {
    loginWindow = new BrowserWindow({width: 800, height: 600, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 600, transparent: false})
    loginWindow.setMenu(null)
    loginWindow.loadURL(url.format({
        pathname: path.join(__dirname, './views/login/login.html'),
        protocol: 'file:',
        slashes: true
    }))
    loginWindow.webContents.openDevTools({mode: "undocked"})
    loginWindow.on('closed', function () {
        loginWindow = null
    })
}

function createConnectWindow () {
    connectWindow = new BrowserWindow({width: 800, height: 850, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 850, transparent: false})
    connectWindow.setMenu(null)
    connectWindow.loadURL(url.format({
    pathname: path.join(__dirname, './views/connect/connect.html'),
    protocol: 'file:',
    slashes: true
    }))
    connectWindow.webContents.openDevTools()
    connectWindow.on('closed', function () {
        connectWindow = null
    })
}

function createAlertWindow () {
    alertWindow = new BrowserWindow({width: 800, height: 450, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 450, transparent: false})
    alertWindow.setMenu(null)
    alertWindow.loadURL(url.format({
    pathname: path.join(__dirname, './views/alert/alert.html'),
    protocol: 'file:',
    slashes: true
    }))
    //alertWindow.webContents.openDevTools()
    alertWindow.on('closed', function () {
        alertWindow = null
    })
}
app.on('ready', createLoginWindow)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (loginWindow === null && connectWindow === null) {
        createLoginWindow()
    }
})

exports.login = () => {
    //Open new window first to prevent suicide
    createLoginWindow()
    connectWindow.close()
    alertWindow.close()
}

exports.connect = () => {
    //Open new window first to prevent suicide
    createConnectWindow()
    loginWindow.close()
}

exports.alert = () => {
    createAlertWindow()
    connectWindow.close()
}