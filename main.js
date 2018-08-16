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
const notify = require('node-notifier')
const os = require('os')
const globalShortcut = electron.globalShortcut
const isOnline = require('is-online');
var windowCloseCheck = null, loginWindow = null, connectWindow = null, alertWindow = null, updateWindow = null, checkNetwork = null, ovpnCurrentConnection = null, tray = null, contextMenu = null, adminWindow = null


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

//Squirrel above this point.

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
    loginWindow = new BrowserWindow({width: 800, height: 600, icon: path.resolve(__dirname, 'icons', 'icon.ico'), 'minWidth': 800, 'minHeight': 600, transparent: false, title: "Viper Login", resizable: false})
    loginWindow.setMenu(null)
    loginWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/login/login.html'),
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
    connectWindow = new BrowserWindow({width: 830, height: 750, icon: path.resolve(__dirname, 'icons', 'icon.ico'), transparent: false, title: "Viper Connect", resizable: false})
    connectWindow.setMenu(null)
    connectWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/connect/connect.html'),
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
    tray = new Tray(path.resolve(__dirname, 'icons', 'icon.ico'))
    contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Viper', click: () => {
                connectWindow.show()
            }
        },
        {
            label: 'Quit', click: () => {
                windowCloseCheck = 1
                ovpnConnection('disconnect', app.quit)
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
    alertWindow = new BrowserWindow({width: 800, height: 350, icon: path.resolve(__dirname, 'icons', 'icon.ico'), 'minWidth': 800, 'minHeight': 350, transparent: false, title: "Viper Alert", resizable: false})
    alertWindow.setMenu(null)
    alertWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/alert/alert.html'),
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
    updateWindow = new BrowserWindow({width: 800, height: 350, icon: path.resolve(__dirname, 'icons', 'icon.ico'), 'minWidth': 800, 'minHeight': 350, transparent: false, title: "Viper Update", resizable: false})
    updateWindow.setMenu(null)
    updateWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/update/update.html'),
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
function createAdminWindow () {
    if (tray) {
        tray.destroy()
    }
    adminWindow = new BrowserWindow({width: 800, height: 350, icon: path.resolve(__dirname, 'icons', 'icon.ico'), 'minWidth': 800, 'minHeight': 450, transparent: false, title: "Viper Error", resizable: false})
    adminWindow.setMenu(null)
    adminWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/admin/admin.html'),
        protocol: 'file:',
        slashes: true
    }))
    //adminWindow.webContents.openDevTools()
    adminWindow.on('closed', function () {
        adminWindow = null
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
    if (connectWindow != null) {
        connectWindow.close()
        connectWindow = null
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
    fs.readFile(path.resolve(__dirname, 'settings.json'), 'utf8', (err, data) => {
        if (err) {
            //If file doesn't exist, this is a first launch.
            log.info("Could not read settings file. Perhaps it doesn't exist?")
            //Create settings file.
            fs.writeFile(path.resolve(__dirname, 'settings.json'), '{}', function (err) {
                if (err) {
                    log.info(`Unable to create settings file. Details: ${err}`)
                    createLoginWindow()
                } else {
                    log.info('Settings file created.')
                    createLoginWindow()
                }
            })
        } else {
            //Check if current user is defined.
            if (JSON.parse(data)["current_user"]) {
                log.info("Currently logged in.")
                createConnectWindow()
            } else {
                log.info("Not logged in.")
                createLoginWindow()
            }
            
        }
    })
})
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (tray) {
            tray.destroy()
        }
        ovpnConnection('disconnect', app.quit)
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

exports.admin = () => {
    createAdminWindow()
}

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


//Manages connection instructions from the connect window
ipcMain.on('connection', (event, args) => {
    if (args === 1) {
        //Told to connect
        log.info('Received command to connect!')
        ovpnConnection('connect')
    } else if (args === 0) {
        //Told to disconnect
        ovpnConnection('disconnect')
    }
})

//When requested, lets the window know whether OpenVPN is running.
ipcMain.on('checkIfConnected', (event, args) => {
    exec(`tasklist`, (error, stdout, stderr) => {
        if (error) {
            log.error(`Could not check if OpenVPN is running. ${error}`)
        } else if (stdout.includes('openvpn.exe')) {
            log.info('openvpn.exe is running. Returning true to connect window.')
            if (connectWindow) {
                connectWindow.webContents.send('checkIfConnected', {connected: true});
            }
        } else {
            log.info('openvpn.exe is not running. Returning false to connect window.')
            if (connectWindow) {
                connectWindow.webContents.send('checkIfConnected', {connected: false});
            }
        }
    })
})

function ovpnConnection(connect, callback) {
    let ovpnPath
    if (os.platform() === "win32") {
        ovpnPath = `C:\\Program Files\\OpenVPN\\bin`
        log.info(`OpenVPN directory set to ${ovpnPath}`)
    } else {
        log.error("Unsupported OS")
    }
    if (connect === "connect") {
        log.info(`Starting OpenVPN connection.`)
        let current_vpn = path.resolve(__dirname, 'current_vpn.ovpn')
        log.info(current_vpn)
        ovpnCurrentConnection = exec(`"${ovpnPath}\\openvpn.exe\" --config \"${current_vpn}\" --connect-timeout 10`)
        ovpnCurrentConnection.stdout.on('data', (data) => {
            log.info(`OpenVPN stdout: ${data}`)
            if (data.includes('Initialization Sequence Completed')) {
                log.info(`OpenVPN Connected!`)
                if (checkNetwork === 0 || !checkNetwork) {
                    checkNetwork = 1
                    networkCheck()
                }
                if (connectWindow) {
                    connectWindow.webContents.send('connection', {connection: 1});
                }
                if (callback) {
                    callback()
                }
            }
            if (data.includes('SIGUSR1[connection failed(soft),init_instance]')) {
                log.info(`OpenVPN failed to connect.`)
                checkNetwork = 0
                if (connectWindow) {
                    connectWindow.reload()
                }
                if (callback) {
                    callback()
                }
                ovpnConnection("disconnect")
            }
            if (data.includes('Closing TUN/TAP interface')) {
                log.info(`OpenVPN has disconnected on its own.`)
                checkNetwork = 0
                if (connectWindow) {
                    connectWindow.webContents.send('connectionLost', {connection: 0});
                }
                if (callback) {
                    callback()
                }
                notify.notify({
                    title: 'Viper VPN Alert',
                    message: `Viper has unexpectedly disconnected. We will now try to reconnect you.`,
                    icon: path.resolve(__dirname, 'icons', 'icon.ico')
                });
            }
            if (data.includes('All TAP-Windows adapters on this system are currently in use.')) {
                log.info(`There is another program (VPN) connected to the TAP adaptor.`)
                checkNetwork = 0
                if (connectWindow) {
                    connectWindow.webContents.send('connection', {connection: 2});
                }
                if (callback) {
                    callback()
                }
                ovpnConnection("disconnect")
            }
        })
        ovpnCurrentConnection.stderr.on('data', (data) => {
            log.info(`OpenVPN stderr: ${data}`)
        })
        ovpnCurrentConnection.on('close', (data) => {
            log.info(`OpenVPN closed: ${data}`)
            if (connectWindow) {
                connectWindow.webContents.send('connection', {connection: 0});
            }
            checkNetwork = 0
        })
    } else if (connect === "disconnect") {
        log.info(`Starting OpenVPN disconnection.`)
        exec(`taskkill /IM openvpn.exe /F`, (error, stdout, stderr) => {
            let errorConverted = error + ""
            if (errorConverted.indexOf(`The process "openvpn.exe" not found.`) != -1) {
                //Error was reported because the VPN was not connected to begin with. This is a safe error.
                log.info(`OpenVPN stdout: ${stdout}`)
                log.info(`OpenVPN stderr: ${stderr}`)
                checkNetwork = 0
                if (connectWindow) {
                    connectWindow.webContents.send('connection', {connection: 0});
                }     
                if (callback) {
                    callback()
                }
            } else if (error) {
                log.error(`Error disconnecting from OpenVPN: ${error}`)
                if (connectWindow) {
                    connectWindow.webContents.send('connection', {connection: 0});
                }
            } else {
                log.info(`OpenVPN stdout: ${stdout}`)
                log.info(`OpenVPN stderr: ${stderr}`)
                checkNetwork = 0
                if (connectWindow) {
                    connectWindow.webContents.send('connection', {connection: 0});
                }
                if (callback) {
                    callback()
                }
            }
        })
    }
}

function networkCheck () {
    if (checkNetwork === 1) {
        isOnline({timeout: 10000}).then(online => {
            if (online === true) {
                log.verbose("Internet connection detected.")
                setTimeout(() => {networkCheck()}, 1000)
            } else {
                log.info("No internet connection detected.")
                notify.notify({
                    title: 'Viper VPN Alert',
                    message: `We've detected that you've lost connection to the internet. To prevent any issues getting back online, we've disconnected Viper. Once you're back online, you can reconnect.`,
                    icon: path.resolve(__dirname, 'icons', 'icon.ico')
                });
                exec(`taskkill /IM openvpn.exe /F`, (error, stdout, stderr) => {
                    if (error) {
                        log.error(`Error disconnecting from OpenVPN: ${error}`)
                        if (connectWindow) {
                            connectWindow.webContents.send('networkCheckDisconnect', {connection: 1});
                        }
                        
                    } else {
                        log.info(`OpenVPN stdout: ${stdout}`)
                        log.info(`OpenVPN stderr: ${stderr}`)
                        if (connectWindow) {
                            connectWindow.webContents.send('networkCheckDisconnect', {connection: 0});
                        }
                    }
                })
            }
        })
    }

}

