const remote = require('electron').remote
const main = remote.require('./main.js')

/* var button = document.createElement('button')
button.textContent = 'Open Window'
button.addEventListener('click', () => {
	main.openWindow()
}, false)
document.body.appendChild(button) */

var loginButton = document.getElementById("login")
loginButton.addEventListener("click", function(){
	var user = document.getElementById("username").value
	var pass = document.getElementById("password").value
	var loginDiv = document.getElementById("loginDiv")
	loginDiv.innerHTML = '<img src="./assets/img/loading.gif">'
	if (user && pass){
		main.verify()
	} else {
		loginDiv.innerHTML = '<div class="loginmodal-container"><h1>No Username and/or Password</h1><br><input type="submit" name="login" id="login" class="login loginmodal-submit" value="Retry" onClick="window.location.href=window.location.href"></div>'
	}

})