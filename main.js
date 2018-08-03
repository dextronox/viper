const electron = require('electron')
const ipcMain = require('electron').ipcMain
const Menu = require('electron').Menu
const Tray = require('electron').Tray
const exec = require('child_process').exec
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const log = require('electron-log')
const fs = require('fs')
const internetAvailable = require('internet-available')
const notify = require('node-notifier')
const os = require('os')
var windowCloseCheck, loginWindow, connectWindow, alertWindow, updateWindow, checkNetwork, ovpnCurrentConnection, tray, contextMenu

// Same as for console transport
log.transports.file.level = 'info';
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
    if (tray) {
        tray.destroy()
    }
    loginWindow = new BrowserWindow({width: 800, height: 600, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 600, transparent: false, title: "Viper Login", resizable: false})
    loginWindow.setMenu(null)
    loginWindow.loadURL(url.format({
        pathname: path.join(__dirname, './views/login/login.html'),
        protocol: 'file:',
        slashes: true
    }))
    //loginWindow.webContents.openDevTools({mode: "undocked"})
    loginWindow.on('closed', function () {
        loginWindow = null
    })
    if (connectWindow != null) {
        windowCloseCheck = 1
        connectWindow.close()
        connectWindow = null
    }
    if (alertWindow != null) {
        loginWindow.close()
        loginWindow = null
    }
    if (updateWindow != null) {
        updateWindow.close()
        updateWindow = null
    }
}

function createConnectWindow () {
    windowCloseCheck = null
    //log.info(`Login: ${loginWindow} Connect: ${connectWindow} Alert: ${alertWindow} Update: ${updateWindow} Network Check: ${checkNetwork} OpenVPN Current Connection: ${ovpnCurrentConnection} Tray: ${tray} Context Menu: ${contextMenu}`)
    connectWindow = new BrowserWindow({width: 830, height: 750, icon: "./icons/icon.png", transparent: false, title: "Viper Connect", resizable: true})
    connectWindow.setMenu(null)
    connectWindow.loadURL(url.format({
        pathname: path.join(__dirname, './views/connect/connect.html'),
        protocol: 'file:',
        slashes: true
    }))
    //connectWindow.webContents.openDevTools()
    connectWindow.on('minimize',function(event){
        event.preventDefault();
        connectWindow.hide();
    });
    connectWindow.on('close', (event) => {
        if (!windowCloseCheck) {
            event.preventDefault()
            connectWindow.hide()
        }
    })
    tray = new Tray('./icons/icon.ico')
    contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Viper', click: () => {
                connectWindow.show()
            }
        },
        {
            label: 'Quit', click: () => {
                windowCloseCheck = 1
                app.quit()
            }
        }
    ])
    tray.setContextMenu(contextMenu)
    tray.setToolTip('Show Viper VPN')
    tray.on('click', () => {
        connectWindow.show()
    })
    if (alertWindow != null) {
        alertWindow.close()
        alertWindow = null
    }
    if (loginWindow != null) {
        loginWindow.close()
        loginWindow = null
    }
    if (updateWindow != null) {
        updateWindow.close()
        updateWindow = null
    }
}

function createAlertWindow () {
    if (tray) {
        tray.destroy()
    }
    alertWindow = new BrowserWindow({width: 800, height: 350, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 450, transparent: false, title: "Viper Alert", resizable: false})
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
    if (connectWindow != null) {
        windowCloseCheck = 1
        connectWindow.close()
        connectWindow = null
    }
    if (loginWindow != null) {
        loginWindow.close()
        loginWindow = null
    }
    if (updateWindow != null) {
        updateWindow.close()
        updateWindow = null
    }
}
function createUpdateWindow () {
    if (tray) {
        tray.destroy()
    }
    updateWindow = new BrowserWindow({width: 800, height: 350, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 450, transparent: false, title: "Viper Update", resizable: false})
    updateWindow.setMenu(null)
    updateWindow.loadURL(url.format({
        pathname: path.join(__dirname, './views/update/update.html'),
        protocol: 'file:',
        slashes: true
    }))
    //updateWindow.webContents.openDevTools()
    updateWindow.on('closed', function () {
        updateWindow = null
    })
    if (connectWindow != null) {
        windowCloseCheck = 1
        connectWindow.close()
        connectWindow = null
    }
    if (loginWindow != null) {
        loginWindow.close()
        loginWindow = null
    }
    if (alertWindow != null) {
        alertWindow.close()
        alertWindow = null
    }
}

app.on('ready', () => {
    exec(`tasklist`, (error, stdout, stderr) => {
        if (error) {
            log.error(`Could not check if OpenVPN is running. ${error}`)
        } else if (stdout.includes('openvpn.exe')) {
            log.info('openvpn.exe is running. Beginning network check.')
            checkNetwork = 1
            networkCheck()
        }
    })
    createLoginWindow()
})
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (tray) {
            tray.destroy()
        }
        app.quit()
    }
})
app.on('activate', function () {
    if (loginWindow === null && connectWindow === null) {
        createLoginWindow()
    }
})

exports.login = () => {
    createLoginWindow()
}

exports.connect = () => {
    createConnectWindow()
}

exports.alert = () => {
    createAlertWindow()    
}
exports.update = () => {
    createUpdateWindow()   
}

//Squirrel
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}
  
function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }
  
    const ChildProcess = require('child_process');
    const path = require('path');
  
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
  
    const spawn = function(command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
        } catch (error) {}

        return spawnedProcess;
    };
  
    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };
  
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Optionally do things such as:
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and
        //   explorer context menus
  
        // Install desktop and start menu shortcuts
        spawnUpdate(['--createShortcut', exeName]);
  
        setTimeout(app.quit, 1000);
        return true;
  
      case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and
        // --squirrel-updated handlers
  
        // Remove desktop and start menu shortcuts
        spawnUpdate(['--removeShortcut', exeName]);
  
        setTimeout(app.quit, 1000);
        return true;
  
      case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated
  
        app.quit();
        return true;
    }
};

// ipcMain.on('networkCheck', (event, args) => {
//     if (args === 1) {
//         if (checkNetwork = 0) {
//             checkNetwork = 1
//             networkCheck()
//         }
//     } else if (args === 0) {
//         checkNetwork = 0
//     }
// })

ipcMain.on('connection', (event, args) => {
    if (args === 1) {
        //Told to connect
        ovpnConnection('connect')
    } else if (args === 0) {
        //Told to disconnect
        ovpnConnection('disconnect')
    }
})

ipcMain.on('checkIfConnected', (event, args) => {
    exec(`tasklist`, (error, stdout, stderr) => {
        if (error) {
            log.error(`Could not check if OpenVPN is running. ${error}`)
        } else if (stdout.includes('openvpn.exe')) {
            log.info('openvpn.exe is running. Returning true.')
            connectWindow.webContents.send('checkIfConnected', {connected: true});
        } else {
            log.info('openvpn.exe is not running. Returning false.')
            connectWindow.webContents.send('checkIfConnected', {connected: false});
        }
    })
})

function networkCheck () {
    if (checkNetwork === 1) {
        internetAvailable({
            timeout: 5000,
            retires: 10
        }).then(() => {
            log.verbose("Internet connection detected.")
            setTimeout(() => {networkCheck()}, 1000)
        }).catch(() => {
            log.info("No internet connection detected.")
            notify.notify({
                title: 'Viper VPN Alert',
                message: `We've detected that you've lost connection to the internet. To prevent any issues getting back online, we've disconnected Viper. Once you're back online, you can reconnect.`,
                icon: `./icons/icon.ico`
            });
            exec(`taskkill /IM openvpn.exe /F`, (error, stdout, stderr) => {
                if (error) {
                    log.error(`Error disconnecting from OpenVPN: ${error}`)
                    if (connectWindow) {
                        connectWindow.webContents.send('connectivity', {connection: 0});
                    }
                    
                } else {
                    log.info(`OpenVPN stdout: ${stdout}`)
                    log.info(`OpenVPN stderr: ${stderr}`)
                    if (connectWindow) {
                        connectWindow.webContents.send('connectivity', {connection: 1});
                    }
                }
            })
        })
    }

}

function ovpnConnection(connect) {
    let ovpnPath
    if (os.arch() === "x64") {
        ovpnPath = `C:\\Program Files\\OpenVPN\\bin`
        log.info(`OpenVPN directory set to ${ovpnPath}`)
    } else if (os.arch() === "ia32") {
        ovpnPath = "C:\\Program Files\\OpenVPN\\bin"
        log.info(`OpenVPN directory set to ${ovpnPath}`)
    } else {
        log.error("Arch check fail")
    }
    if (connect === "connect") {
        log.info(`Starting OpenVPN connection.`)
        ovpnCurrentConnection = exec(`"${ovpnPath}\\openvpn.exe\" --config current_vpn.ovpn\"`)
        ovpnCurrentConnection.stdout.on('data', (data) => {
            log.info(`OpenVPN stdout: ${data}`)
            if (data.includes('Initialization Sequence Completed')) {
                log.info(`OpenVPN Connected!`)
                if (checkNetwork === 0) {
                    checkNetwork = 1
                    networkCheck()
                }
                connectWindow.webContents.send('connection', {connection: 1});
            }
        })
        ovpnCurrentConnection.stderr.on('data', (data) => {
            log.info(`OpenVPN stderr: ${data}`)
        })
        ovpnCurrentConnection.on('close', (data) => {
            log.info(`OpenVPN closed: ${data}`)
            connectWindow.webContents.send('connection', {connection: 0});
            checkNetwork = 0
            networkCheck()
        })
    } else if (connect === "disconnect") {
        log.info(`Starting OpenVPN disconnection.`)
        exec(`taskkill /IM openvpn.exe /F`, (error, stdout, stderr) => {
            if (error) {
                log.error(`Error disconnecting from OpenVPN: ${error}`)
                connectWindow.webContents.send('connection', {connection: 1});
            } else {
                log.info(`OpenVPN stdout: ${stdout}`)
                log.info(`OpenVPN stderr: ${stderr}`)
                checkNetwork = 0
                connectWindow.webContents.send('connection', {connection: 0});
            }
        })
    }
}