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


const server = require('http').createServer(app);
const WebSocket = require('ws');
const port = 3000;
server.listen(port, () => {
    console.log("listening on port", port);
});




//------------------------------------------------//
//---------------AUTHENTICATION-------------------//
/**
 * @brief initializing passport
 */
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

/**
 * @brief middleware to check if user is authenticated. If not, redirecting to /login
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns next() if authenticated, otherwise redirects to /login
 */
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

/**
 * @brief sends login.ejs file to user to log in
 */
app.get("/login", (req, res) => {
    res.render('login.ejs')
})

/** 
 * Checks if inserted username and passport are correct. If success, redirects to "/", else "/login"
 * @brief Checks if username and passport is correct.
 */
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

/**
 * @brief logs user out.
 */
app.get('/logout', (req, res) => {
    console.log("logout");
    req.logOut();
    res.redirect('/');
})

//------------------------------------------------//
//---------------ROUTES---------------------------//
app.get('/testi', checkAuthenticated, async(req, res) => {
    wss.clients.forEach(function each(client) {
        let message = JSON.stringify({ isCarOnline: true })
        client.send(message);
    });
    res.sendStatus(204);
});
/**
 * @brief sends index page to user
 */
app.get('/', checkAuthenticated, async(req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

/**
 * @brief sends livepage to user
 */
app.get('/live', checkAuthenticated, async(req, res) => {
    res.sendFile(path.join(__dirname, '/views/live.html'));
})

/**
 * @brief sends historypage to user
 */
app.get('/history', checkAuthenticated, async(req, res) => {
    res.sendFile(path.join(__dirname, '/views/history.html'));
})

/**
 * @brief sends settingspage to user 
 */
app.get('/settings', checkAuthenticated, async(req, res) => {
    res.sendFile(path.join(__dirname, '/views/settings.html'));
})

/**
 * @brief sends converterpage to user 
 */
app.get('/converter', checkAuthenticated, async(req, res) => {
    res.sendFile(path.join(__dirname, '/views/converter.html'));
})

/**

 * @brief gets the latest data values from database, converts it to physical value and sends it to user.
 */
app.get("/updateLive", checkAuthenticated, async(req, res) => {
    let selectedCans = JSON.parse(req.query.can);
    let latestMessages = [];

    // for every can ID in request query, loads the latest data from database, uses dbcParser to calculate physical value,
    // and pushes it to array
    for (let i in selectedCans) {
        try {
            let rawData = await getLatestData(selectedCans[i].can);
            let physicalValue = dbcParser.calculateValue({ canID: rawData[0].canID, data: rawData[0].data, time: rawData[0].timestamp })

            latestMessages.push(physicalValue);
        } catch {
            console.log("something went wrong");
        }
    }
    // sends array containing all the physical values to client
    res.send({ data: latestMessages }).status(200);
})

/**
 * @brief loads can IDs and names from the dbc file and sends it to user
 */
app.get("/loadCans", checkAuthenticated, async(req, res) => {
    let canList = dbcParser.getCanNames();
    res.send({ canList: canList }).status(204);
})

/**
 * @brief saves the user uploaded dbc file to database
 */
app.post("/uploadDBC", upload.single('dbcFile'), (req, res) => {
    return res.json({ status: 'saved' })
})

/**
 * @brief gets names of the dbc files that are in database/dbcFiles folder and sends array to user
 */
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

/**
 * @brief deletes dbc file from database
 */
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

/**
 * @brief sends the dbcfile to user
 * FIXME: not working yet
 */
app.get("/downloadDbcFile", (req, res) => {
    const path = './database/dbcFiles/' + req.query.filename;
    fs.readFile(path, (err, data) => {
        if (err) {
            return next(err);
        }
        res.send(data);
    })
});

/**
 * @brief changes the dbc file to the one that user has selected
 */
app.get("/changeDbcFile", async(req, res) => {
    const fileName = req.query.filename;
    try {
        // lets the dbcParser to load file to use
        dbcParser.loadDbcFile(fileName);

        // changes from database the active file. This is for the server to know what was the last 
        // file that was in use before restarting the server
        await db("activeSettings").where({ name: "dbcFile" }).update({ status: fileName });
        res.sendStatus(204);
    } catch (error) {
        res.send(error).status(500);
    }
})

/**
 * @brief gets history data from database
 */
app.get("/getHistory", async(req, res) => {
    // Creating query to use to get the correct data from database
    let canID = req.query.can;
    let query = "select * from data where timestamp BETWEEN'" + req.query.startTime + "' AND '" + req.query.endTime + "' AND canID='" + canID + "';"
    let calculatedValues = [];
    try {
        let getData = await db.raw(query);

        // if there was no data between that time and for the can ID, send status 404
        if (getData.length === 0) {
            res.sendStatus(404);
            return;
        }

        // for each data, calculate physical value of it and save to new array
        getData.forEach((data) => {
            calculatedValues.push(dbcParser.calculateValue(data));
        })

        // send calculated values to client
        res.send({ data: calculatedValues }).status(204);
    } catch {
        res.sendStatus(500);
    }
})

/**
 * @brief gets canID and hex string as query parameters, calculates real values
 * and returns it.
 */
app.get("/calculateValue", (req, res) => {
    console.log(req.query);
    let values = dbcParser.calculateValue(req.query);
    res.send({ value: values }).status(204);
})

//------------------------------------------------//
//----------------Web Socket----------------------//
const wss = new WebSocket.Server({ server: server });

/**
 * @brief when new websocket client is connected, send car status back immediately.
 */
wss.on('connection', async function connection(ws) {
    console.log('A new Websocket- client Connected!');
    let isCarOnline = await checkIfCarIsOnline();
    let sendMessage = JSON.stringify({ carStatus: isCarOnline })
    ws.send(sendMessage);
});

/**
 * @brief sends calculated data array to every websocket client
 * @param {{ canID: string, data: hexadecimal, DLC: string, timestamp: string}} rawData data in hexadecimal form.
 */
function sendLiveData(rawData) {
    let dataArray = [];
    for (let i in rawData) {
        let calculatedValue = dbcParser.calculateValue(rawData[i]);
        if (calculatedValue.error) throw calculatedValue;
        dataArray.push(calculatedValue);
    }

    wss.clients.forEach(function each(client) {
        let message = JSON.stringify({ carStatus: true, latestMessage: dataArray })
        client.send(message);
    });
}

function sendDebugMessage(rawMessage) {
    wss.clients.forEach(function each(client) {
        let message = JSON.stringify({ debug: { message: rawMessage }, carStatus: true })
        client.send(message);
    });
}

//------------------------------------------------//
//------------------MQTT--------------------------//
// create MQTT OBJECT
//const client = mqtt.connect("mqtt:localhost:1883", { clientId: "telemetry_server" });
const client = mqtt.connect("mqtt:152.70.178.116:1883", { clientId: "laasdtop" });

// connecting to mqtt broker
client.on("connect", function() {
    console.log("connected to MQTT broker!");
})

// subscribe topic
client.subscribe("messages");

// receive MQTT messages
client.on('message', async function(topic, message, packet) {
    try {
        const rawData = dbcParser.parseMessage(message.toString('hex'));
        sendLiveData(rawData);
        saveData(rawData);
        sendDebugMessage({ error: null, received: message.toString('hex') });
    } catch (error) {
        console.log("message is corrupted!");
        sendDebugMessage({ error: error, received: message.toString('hex') });
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
 * @brief changing dbc file to the one that was selected before shutting down
 */
async function loadDbc() {
    let dbcFile = await db("activeSettings").where({ name: "dbcFile" });
    dbcParser.loadDbcFile(dbcFile[0].status);
}
loadDbc();

/**
 * @brief save received message to database
 * @param data {{canID: text, data: text, DLC:text, timestamp:text}}
 * @returns nothing
 */
async function saveData(data) {
    for (let i in data) {
        try {
            await db('data').insert({
                canID: data[i].canID,
                data: data[i].data,
                DLC: data[i].DLC,
                timestamp: data[i].timestamp
            });
        } catch (error) {
            console.log("Can't save data!");
            // console.log(error);
        }
    }
}

/**
 * @brief gets the latest data from database 
 * @param {string} CANID can ID what data you want
 * @returns {array} the latest data from database [{ID, canID, data, timestamp, DLC}]
 */
async function getLatestData(CANID) {
    return await db('data').where({
        canID: CANID
    }).orderBy('ID', 'desc').limit(1).select();
}


//------------------------------------------------//
//-----------------FUNCTIONS----------------------//
/**
 * @brief checks the current time and sends a timestamp of it
 * @param {number} minuteOffset offset of minutes, if wanted timestamp x minutes before current time. Default value is 0.
 * @returns {string} timestamp: "2022-01-24 9:41:12.567"
 */
function getTime(minuteOffset = 0) {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let hr = today.getHours();
    let min = today.getMinutes();
    let sec = today.getSeconds();
    let ms = today.getMilliseconds();

    month = checkTime(month);
    day = checkTime(day);
    hr = checkTime(hr);
    sec = checkTime(sec);
    ms = checkTime(ms);

    min = parseInt(min) + parseInt(minuteOffset);
    min = checkTime(min);

    let timestamp = year + "-" + month + "-" + day + " " + hr + ":" + min + ":" + sec + "." + ms;
    return timestamp;
}

/**
 * @brief checks if number is under 10, then adds 0 in front of it. 1 -> 01
 * @param {number} i number to be checked
 * @returns {string} same number as parameter but 0 in front if it is under 10
 */
function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
}

/**
 * @brief checks if the car has sent any messages in the past 5 minutes
 * @returns  {boolean} true if there was new messages in the last 5 minutes, false if not
 */
async function checkIfCarIsOnline() {
    // gets the current time -5 minutes
    let timestamp = getTime(-1);

    // creating query to check if there is any data after the timestamp
    let query = "select * from data where timestamp >= '" + timestamp + "';";
    try {

        let data = await db.raw(query);

        // if got any data from database, return true, else false
        if (data.length > 0) return true;
        return false;

    } catch (error) {
        return false;
    }
}