const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/mobile", (req, res) => {
    console.log(`User Login: ${JSON.stringify(req.body["Login"])}`)
    console.log(`Username: ${JSON.stringify(req.body["Name"])}`)
    console.log(`Email: ${JSON.stringify(req.body["Email"])}`)
    rresponse = {
        "Name": req.body["Name"],
        "Login": req.body["Login"],
        "Email": req.body["Email"]
    }
    res.send(rresponse)
})

app.listen(3001, () => {
    console.log("API started on port 3001")
})