'use strict';

const path = require('path');
const express = require('express');
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');


//------------------------------------------------//
//---------------ROUTES---------------------------//
//TODO: authenticate user
app.get('/', (req, res) => {
    // Send a landing page
    res.sendFile(path.join(__dirname,'/views/index.html'));
});

app.get('/live', (req, res) => {
    //TODO: send live data
})

app.get('/history', (req, res) => {
    //TODO: send history data
})

app.post('/newCAN', (req, res) => {
    //TODO: save new can ID to database
})


//------------------------------------------------//
//------------------MQTT--------------------------//

//TODO: create MQTT OBJECT
//TODO: receive MQTT messages
//TODO: send livedata to client
//TODO: translate and save MQTT messages


//------------------------------------------------//
//-----------------DATABASE-----------------------//
//TODO: save data
//TODO: retrieve data
//TODO: saved data: canIDs with names, [canID, data, timestamp, session nr], users


//------------------------------------------------//
//-----------------FUNCTIONS----------------------//
//TODO: realtime clock with millisecond accuracy for saving timestamp

app.listen(3000);
