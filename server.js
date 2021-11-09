'use strict';

const path = require('path');
const express = require('express');
const app = express();
const mqtt = require('mqtt');

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs');

const port = 3000;


//------------------------------------------------//
//---------------ROUTES---------------------------//
//TODO: authenticate user
app.get('/', (req, res) => {
    // Send a landing page
    console.log("/");
    res.sendFile(path.join(__dirname,'/views/index.html'));
});

app.get('/live', (req, res) => {
    //TODO: send live data
    console.log("live");
    res.sendFile(path.join(__dirname,'/views/live.html'));
})

app.get('/history', (req, res) => {
    //TODO: send history data
    console.log("history");
    res.sendFile(path.join(__dirname,'/views/history.html'));
})

app.get('/settings', (req, res) => {
    //TODO: save new can ID to database
    console.log("settings");
    res.sendFile(path.join(__dirname,'/views/settings.html'));
})


//------------------------------------------------//
//------------------MQTT--------------------------//

// create MQTT OBJECT
const client = mqtt.connect("mqtt:localhost:1883", {clientId: "telemetry_server"});

// connecting to mqtt broker
client.on("connect", function () {
    console.log("connected to MQTT broker!");
})

// subscribe topic
client.subscribe("messages");

// receive MQTT messages
client.on('message', async function (topic, message, packet) {
    try {
        let JSONmessage = JSON.parse(message);
        console.log(JSONmessage);
    } catch {
        console.log("message not in JSON-format!");
        console.log(message.toString());
    }
});

//TODO: send livedata to client

//TODO: translate and save MQTT messages


//------------------------------------------------//
//-----------------DATABASE-----------------------//
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./database/telemetry.db"
    },
    useNullAsDefault: true
});

//TODO: save data
/**
 * @function saveData
 * @desc save received message to database
 * @param data {JSON}  data to save {"canID":xxx, "message":yyy, "timestamp":123, "session":1}
 * @property canID {} canID where the message came from
 * @property message {} the message itself
 * @property timestamp {} timestamp when the message was received
 * @property {integer} session number of the session. Check from database what is the last session number and increment it by 1.
 */
function saveData(data) {

}
//TODO: retrieve data


//TODO: saved data: canIDs with names, [canID, data, timestamp, session nr], users


//------------------------------------------------//
//-----------------FUNCTIONS----------------------//
//TODO: realtime clock with millisecond accuracy for saving timestamp

app.listen(port, () => {
    console.log("listening on port", port);
});
