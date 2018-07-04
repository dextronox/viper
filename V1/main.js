const {app, BrowserWindow} = require('electron')
require('electron-dl')();

app.on('ready', () => {
	let win = new BrowserWindow({width:300, height:351, frame: false, show: false, useContentSize: true})
	win.loadURL(`file://${__dirname}/index.html`)
	win.webContents.openDevTools()
	win.setMenu(null);
	win.once('ready-to-show', () => {
		win.show()
	})
})
//template for opening another html file
exports.verify = () => {
	electronDl.download(win, "http://unrestrict.me/viper/verify.txt")
}