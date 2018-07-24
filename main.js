const electron = require('electron')
const ipcMain = require('electron').ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const log = require('electron-log')
const fs = require('fs')
const internetAvailable = require('internet-available')
const notify = require('node-notifier')
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
}

function createConnectWindow () {
    connectWindow = new BrowserWindow({width: 800, height: 850, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 850, transparent: false, title: "Viper Connect", resizable: false})
    connectWindow.setMenu(null)
    connectWindow.loadURL(url.format({
    pathname: path.join(__dirname, './views/connect/connect.html'),
    protocol: 'file:',
    slashes: true
    }))
    //connectWindow.webContents.openDevTools()
    connectWindow.on('closed', function () {
        connectWindow = null
    })
}

function createAlertWindow () {
    alertWindow = new BrowserWindow({width: 800, height: 450, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 450, transparent: false, title: "Viper Alert", resizable: false})
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
function createUpdateWindow () {
    updateWindow = new BrowserWindow({width: 800, height: 450, icon: "./icons/icon.png", 'minWidth': 800, 'minHeight': 450, transparent: false, title: "Viper Update", resizable: false})
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
}

app.on('ready', () => {
    createLoginWindow()
})
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
    if (connectWindow) {
        connectWindow.close()
    }
    if (alertWindow) {
        alertWindow.close()
    }
    
}

exports.connect = () => {
    //Open new window first to prevent suicide
    createConnectWindow()
    loginWindow.close()
    updateWindow.close()
    
}

exports.connectAlert = () => {
    createConnectWindow()
    alertWindow.close()
}

exports.alert = () => {
    createAlertWindow()
    if (connectWindow) {
        connectWindow.close()
    }
    
}
exports.update = () => {
    createUpdateWindow()
    if (connectWindow) {
        connectWindow.close()
    }
    
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

let checkNetwork

ipcMain.on('networkCheck', (event, args) => {
    if (args === 1) {
        checkNetwork = 1
        networkCheck()
    } else if (args === 0) {
        checkNetwork = 0
    }
})

function networkCheck () {
    if (checkNetwork === 1) {
        internetAvailable({
            timeout: 3000,
            retires: 5
        }).then(() => {
            log.info("Internet connection detected.")
            setTimeout(() => {networkCheck()})
        }).catch(() => {
            log.info("No internet connection detected.")
            notify.notify({
                title: 'Viper VPN Alert',
                message: `We've detected that you've lost connection to the internet. Once you regain connection, you might have to disconnect and reconnect to Viper.`
            });
        })
    }

}