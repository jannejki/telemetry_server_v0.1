'use strict';
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const path = require('path');
const express = require('express');
const app = express();
const mqtt = require('mqtt');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const DBCParser = require('./DBC.js');

const dbcParser = new DBCParser.DbcParser("CAN0.dbc");

const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const initializePassport = require('./passport-config')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'database/dbcFiles');
    },
    filename: (req, file, cb) => {
        const { originalname } = file;
        cb(null, originalname);
    }
})

const upload = multer({ storage })

app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const port = 3000;
app.listen(port, () => {
    console.log("listening on port", port);
});

//let latestMessage;
//------------------------------------------------//
//---------------AUTHENTICATION-------------------//
initializePassport(
    passport,
    async name => {
        let users = await db.select().from("users");
        return users.find(user => user.username === name)
    },
    async id => {
        let users = await db.select().from("users");
        users.find(user => user.id === id)
    }
)

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.get("/login", (req, res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/logout', (req, res) => {
    console.log("logout");
    req.logOut();
    res.redirect('/');
})

//------------------------------------------------//
//---------------ROUTES---------------------------//
app.get('/', checkAuthenticated, (req, res) => {
    // Send a landing page
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/live', checkAuthenticated, async(req, res) => {
    //TODO: send live data
    console.log("live");
    res.sendFile(path.join(__dirname, '/views/live.html'));
})

app.get('/history', checkAuthenticated, (req, res) => {
    //TODO: send history data
    console.log("history");
    res.sendFile(path.join(__dirname, '/views/history.html'));
})

app.get('/settings', checkAuthenticated, (req, res) => {
    //TODO: save new can ID to database
    console.log("settings");
    res.sendFile(path.join(__dirname, '/views/settings.html'));
})

app.post("/selectLiveCan", checkAuthenticated, (req, res) => {
    console.log('Got body:', req.body);
    selectedCAN = req.body.CAN;
    res.sendStatus(204);
})

app.post("/newCAN", checkAuthenticated, async(req, res) => {
    try {
        await db("canID").insert(req.body);
        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
})

app.get("/updateLive", checkAuthenticated, async(req, res) => {
    let selectedCans = JSON.parse(req.query.can);
    let latestMessages = [];

    for (let i in selectedCans) {
        try {
            let rawData = await getLatestData(selectedCans[i].can);
            let physicalValue = dbcParser.calculateValue({ canID: rawData[0].canID, data: rawData[0].data, time: rawData[0].timestamp })
            latestMessages.push(physicalValue);
        } catch {
            console.log("something went wrong");
        }
    }
    console.log(latestMessages);
    //TODO: calculate fysical values from the raw data
    res.send({ data: latestMessages }).status(200);
})

app.get("/loadCans", checkAuthenticated, async(req, res) => {
    let canList = dbcParser.getCanNames();
    res.send({ canList: canList }).status(204);
})

app.delete("/deleteCan", checkAuthenticated, async(req, res) => {
    console.log(req.body);
    try {
        await db("canID").where(req.body).del();
        res.sendStatus(204);
    } catch (error) {
        res.sendStatus(500);
    }
})

app.post("/uploadDBC", upload.single('dbcFile'), (req, res) => {
    return res.json({ status: 'saved' })
})

app.get("/loadDbcFiles", async(req, res) => {
    await fs.readdir(path.join(__dirname, 'database/dbcFiles'), function(err, files) {
        let fileArray = [];

        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function(file) {
            fileArray.push({ filename: file, using: file == dbcParser.dbcFileName });
        });
        res.send({ files: fileArray }).status(204);
    });
})

app.delete("/deleteFile", (req, res) => {
    const path = './database/dbcFiles/' + req.body.filename;

    try {
        fs.unlinkSync(path)
        res.sendStatus(204);
    } catch (err) {
        res.sendStatus(500);
        console.log(err);
    }
});

app.get("/downloadDbcFile", (req, res) => {
    const path = './database/dbcFiles/' + req.query.filename;
    fs.readFile(path, (err, data) => {
        if (err) {
            return next(err);
        }
        res.send(data);
    })
});


app.get("/changeDbcFile", async(req, res) => {
    const fileName = req.query.filename;
    try {
        dbcParser.loadDbcFile(fileName);
        await db("activeSettings").where({ name: "dbcFile" }).update({ status: fileName });
        res.sendStatus(204);
    } catch (error) {
        res.send(error).status(500);
    }
})

app.get("/getHistory", async(req, res) => {
    let canID = req.query.can;
    let query = "select * from data where timestamp BETWEEN'" + req.query.startTime + "' AND '" + req.query.endTime + "' AND canID='" + canID + "';"
    let calculatedValues = [];
    try {
        let getData = await db.raw(query);

        if (getData.length === 0) {
            res.sendStatus(404);
            return;
        }

        getData.forEach((data) => {
            calculatedValues.push(dbcParser.calculateValue(data));
        })

        res.send({ data: calculatedValues }).status(204);
    } catch {
        res.sendStatus(500);
    }

})

//------------------------------------------------//
//------------------MQTT--------------------------//

// create MQTT OBJECT
const client = mqtt.connect("mqtt:localhost:1883", { clientId: "telemetry_server" });
//const client = mqtt.connect("mqtt:152.70.178.116:1883", { clientId: "pc" });

// connecting to mqtt broker
client.on("connect", function() {
    console.log("connected to MQTT broker!");
})

// subscribe topic
client.subscribe("messages");

// receive MQTT messages
client.on('message', async function(topic, message, packet) {
    //  latestMessage = message.toString();
    try {
        saveData(message.toString());
    } catch {
        console.log("message is corrupted!");
    }
});


//------------------------------------------------//
//-----------------DATABASE-----------------------//
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "database/telemetry.db"
    },
    useNullAsDefault: true
});


/**
 * changing dbc file to the one that was selected before shutting down
 */
async function loadDbc() {
    let dbcFile = await db("activeSettings").where({ name: "dbcFile" });
    dbcParser.loadDbcFile(dbcFile[0].status);
}
loadDbc();

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
function getData() {
    let data = db.select().from("canID");
    return data;
}

//TODO: saved data: canIDs with names, [canID, data, timestamp, session nr], users
/**
 * @function newCAN
 * @desc saves new canID to database
 * @param canInfo {JSON} data that contains canID and can name {"canID": 'xxx', "canName":'yyy'}
 * @deprecated 20.1.2022 No need for this because you can load CAN names and IDs from .dbc files
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
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let hr = today.getHours();
    let min = today.getMinutes();
    let sec = today.getSeconds();
    let ms = today.getMilliseconds();
    day = checkTime(day);
    month = checkTime(month);
    min = checkTime(min);
    sec = checkTime(sec);
    ms = checkTime(ms);

    let timestamp = year + "-" + month + "-" + day + " " + hr + ":" + min + ":" + sec + "." + ms;
    return timestamp;
}

// add zero in front of numbers < 10
function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
}