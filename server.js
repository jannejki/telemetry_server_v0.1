'use strict';

const path = require('path');
const express = require('express');
const app = express();
const mqtt = require('mqtt');
const bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const port = 3000;

var selectedCAN;
var latestMessage;
var save = false;


//------------------------------------------------//
//---------------ROUTES---------------------------//
//TODO: authenticate user
app.get('/', (req, res) => {
    // Send a landing page
    console.log("/");
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/live',async (req, res) => {
    //TODO: send live data
    console.log("live");
    res.sendFile(path.join(__dirname, '/views/live.html'));
})

app.get('/history', (req, res) => {
    //TODO: send history data
    console.log("history");
    res.sendFile(path.join(__dirname, '/views/history.html'));
})

app.get('/settings', (req, res) => {
    //TODO: save new can ID to database
    console.log("settings");
    res.sendFile(path.join(__dirname, '/views/settings.html'));
})

app.post("/selectLiveCan", (req, res) => {
    console.log('Got body:', req.body);
    selectedCAN = req.body.CAN;
    res.sendStatus(204);
})

app.post("/newCAN", async (req, res) => {
    let test = await getData();
    console.log(test);
    res.sendStatus(204);
})


latestMessage = 0;
let canID = 1;

app.get("/updateLive", async (req, res) => {
    let selectedCans = JSON.parse(req.query.can);
    let latestMessages = [];
    console.log("\n\nUUSI PYYNTÖ\n\n")

    for(let i in selectedCans) {
        latestMessages.push(await getLatestData(selectedCans[i].can));
    }

    console.log(latestMessages);
    res.send({data: latestMessages}).status(200);
    //res.send({ data: latestMessage }).status(204);
})


//------------------------------------------------//
//------------------MQTT--------------------------//

// create MQTT OBJECT
//const client = mqtt.connect("mqtt:localhost:1883", {clientId: "telemetry_server"});
const client = mqtt.connect("mqtt:152.70.178.116:1883", { clientId: "telemetry_server" });

// connecting to mqtt broker
client.on("connect", function () {
    console.log("connected to MQTT broker!");
})

// subscribe topic
client.subscribe("messages");

// receive MQTT messages
client.on('message', async function (topic, message, packet) {
    console.log(message.toString());
    latestMessage = message.toString();
    try {
        saveData(message.toString());
    } catch {
        console.log("message is corrupted!");
    }
});
//TODO: send livedata to client


//TODO: translate and save MQTT messages


//------------------------------------------------//
//-----------------DATABASE-----------------------//
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "database/telemetry.db"
    },
    useNullAsDefault: true
});

//TODO: save data
/**
 * @function saveData
 * @desc save received message to database
 * @param data {JSON}  data to save {"canID":xxx, "message":yyy}
 * @property canID {} canID where the message came from
 * @property message {} the message itself
 * @property timestamp {} timestamp when the message was received
 * @property {integer} session number of the session. Check from database what is the last session number and increment it by 1.
 */
async function saveData(data) {
    let timestamp = getTime();
    let dataArray = data.split(":");

    while (dataArray.length > 0) {
        console.log(dataArray[0], " ", dataArray[1], " ", dataArray[2]);
        try {
            await db('data').insert({
                canID: dataArray[0],
                data: dataArray[2],
                DLC: dataArray[1],
                timestamp: timestamp,
            }).into("data");
            dataArray.splice(0, 3);
        } catch (error) {
            console.log("can't save data: ", error);
        }
    }
}

//TODO: retrieve data
//TODO: rename function
function getData() {
    let data = db.select().from("canID");
    return data;
}

//TODO: saved data: canIDs with names, [canID, data, timestamp, session nr], users
/**
 * @function newCAN
 * @desc saves new canID to database
 * @param canInfo {JSON} data that contains canID and can name {"canID": 'xxx', "canName":'yyy'}
 */

async function newCAN(canInfo) {
    try {
        await db('canID').insert({
            CANID: canInfo.canID,
            Name: canInfo.canName
        }).into("canID");
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function getLatestData(CANID) {
    return await db('data').where({
        canID: CANID
    }).orderBy('ID', 'desc').limit(1).select();
}


//------------------------------------------------//
//-----------------FUNCTIONS----------------------//
//TODO: realtime clock with millisecond accuracy for saving timestamp
function getTime() {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let day = today.getDay();
    let hr = today.getHours();
    let min = today.getMinutes();
    let sec = today.getSeconds();
    let ms = today.getMilliseconds();
    min = checkTime(min);
    sec = checkTime(sec);
    ms = checkTime(ms);
    let timestamp = day + "-" + month + "-" + year + " " + hr + ":" + min + ":" + sec + ":" + ms;
    return timestamp;
}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }
    ;  // add zero in front of numbers < 10
    return i;
}

function parseMessage(message) {
    let dataArray = message.split(":");
}


app.listen(port, () => {
    console.log("listening on port", port);
});
