// Global variable for timeout object
let timeout;

// Global variable for carStatus html-element
let carStatus = document.getElementById("carStatus");

// Create WebSocket connection.
//const socket = new WebSocket('ws://152.70.178.116:3000');
const socket = new WebSocket('ws://localhost:3000');

// Connection opened
socket.addEventListener('open', function(event) {
    console.log('Connected to WS Server')
});


/**
 * @function
 * @brief Changes car status -element class and text if car is online
 */
socket.addEventListener('message', function(event) {
    let message = JSON.parse(event.data);

    if (document.getElementById("debug").checked && message.debug) {
        console.log(message);
    }

    // Checks if there is carStatus -value in message and it is true
    if (message.carStatus) {

        // if timeout is on, clear it
        if (timeout != undefined) {
            clearTimeout(timeout);
        }

        // changing element class and text
        carStatus.setAttribute("class", "active");
        carStatus.innerHTML = "<p>Online</p>";

        // Setting a timeout to one minute.
        timeout = setTimeout(carNotActive, 60000);
    } else {
        // if there is no carStatus value or it is false, change element class and text
        carNotActive();
    }

    if (message.error) {
        console.log(message.errorMessage);
    }
});

/**
 * @brief Changes carStatus -element class and text to offline
 */
function carNotActive() {
    timeout = undefined;
    carStatus.setAttribute("class", "notActive");
    carStatus.innerHTML = "<p>Offline</p>";
}