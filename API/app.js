#!/usr/bin/env node
require('dotenv').config()
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const fs = require('fs')
const util = require('util')
const base64 = require('base-64');

app.use(cors());
app.use(bodyParser.json());

app.post("/mobile", (req, res) => {
    console.log(`Incoming request...`)
    console.log(`Name: ${JSON.stringify(req.body["Name"])}`)
    console.log(`Login: ${JSON.stringify(req.body["Login"])}`)
    console.log(`Email: ${JSON.stringify(req.body["Email"])}`)
    mobile_request = {
        "Name": req.body["Name"],
        "Login": req.body["Login"],
        "Email": req.body["Email"]
    }
    let requestResponse, attachmentRaw
    let requestOptions = {
        url: `http://139.99.198.205/profiles/${req.body["Name"].toLowerCase()}.ovpn`,
        headers: {
            Authorization: req.body["Login"]
        }
    }
    request.get(requestOptions).on('response', (response) => {
        console.log("Attempted to grab: " + JSON.stringify(response))
        if (response.statusCode === 200) {
            requestResponse = response
        } else {
            console.log(`Error downloading configuation file. Details of the error - Response Code: ${response.statusCode}, Response Message: ${response.statusMessage}`)
            res.status(401)
            res.send("Error")
        }
    }).pipe(fs.createWriteStream(`./attachment.ovpn`).on("finish", () => {
        fs.readFile('./attachment.ovpn', 'utf8', (err, data) => {
            attachmentRaw = base64.encode(util.format(data))
            fs.unlink('./attachment.ovpn', (err) => {
                if (err) {
                    console.log(`Couldn't delete previous attachment`)
                }
            })
            console.log(`Attachment: ${attachmentRaw}`)
            if (requestResponse.statusCode === 200) {
                fs.readFile('./templates/mobile.html', 'utf8', (err, data) => {
                    if (err) {
                        console.log(err)
                        res.status(400)
                        res.send("Error")
                    } else {
                        content = util.format(data);
                        console.log(`Attachment: ${attachmentRaw}`)
                        var mobileEmail = {
                            "personalizations": [
                                {
                                    "to": [
                                        {
                                            "email": mobile_request["Email"],
                                            "name": mobile_request["Name"]
                                        }
                                    ],
                                    "subject": "Your Viper Mobile Profile",
                                    "substitutions": {
                                        "%name%":`${mobile_request["Name"]}`
                                    },
                                }
                            ],
                            "from": {
                                "email": "mobile@viper.unrestrict.me",
                                "name": "Viper VPN Mobile"
                            },
                            "reply_to": {
                                "email": "mobile@viper.unrestrict.me",
                                "name": "Viper VPN Mobile"
                            },
                            "content": [{
                                "type": "text/html",
                                "value": content
                            }],
                            "attachments": [{
                                "content":attachmentRaw,
                                "filename":"profile.ovpn"
                            }]
                        }
                        var mailHeader = {
                            'Authorization': `Bearer ${process.env.MAIL_KEY}`,
                            'Content-Type': 'application/json'
                        }
                        var mailConfig = {
                            url: 'https://api.sendgrid.com/v3/mail/send',
                            method: 'POST',
                            headers: mailHeader,
                            json: mobileEmail
                        }
                        request(mailConfig, (error, response, body) => {
                            if (!error && response.statusCode == 202) {
                                console.log("Email sent successfully to " + mobile_request["Email"])
                                console.error("Response received: " + JSON.stringify(response))
                                res.status(200)
                                res.send(mobile_request)
                            } else {
                                console.error("Email did not send successfully to " + mobile_request["Email"])
                                console.error("Error received: " + JSON.stringify(error))
                                console.error("Response received: " + JSON.stringify(response))
                                res.status(400)
                                res.send(mobile_request)
                            }
                        })
                    }
                })
            } else {
                res.status(500)
                res.send("Error")
            }
        })
    }))

    
})

app.listen(3001, () => {
    console.log("API started on port 3001")
})