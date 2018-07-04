const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
let loginWindow, connectWindow

function createLoginWindow () {
    loginWindow = new BrowserWindow({width: 800, height: 600})
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
    connectWindow = new BrowserWindow({width: 800, height: 800})
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
    createConnectWindow()
    loginWindow.close()
}
