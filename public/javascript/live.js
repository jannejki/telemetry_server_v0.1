/**
 * @desc global variable that sets the update frequency for all interval functions. (in milliseconds)
 * @type {number}
 */
let interval = 100; // updating charts time in milliseconds
/**
 * @desc global variable where latest received message is saved.
 * @type {JSON}
 */
let latestMessage;

/**
 * @desc global variable where the last updated message in the charts is saved
 * @type {JSON}
 */
let lastMessage;

/**
 * @desc global variable that contains values for the ".timeDropDown" -element options. every element represents seconds.
 * @type {number[]}
 */
let xAxisOptionArray = [10, 30, 60, 90, 120, 180];

/**
 * @constructor
 * Constructor function for object that will handle all communicating between server and client.
 */
function ServerInterface() {
    this.idArray = { "canID": [] };
    this.interval = undefined;
    this.latestMessage = undefined;
    this.intervaltime = 2000;
    this.webSocket = new WebSocket('ws://152.70.178.116:3000');
    //this.webSocket = new WebSocket('ws://127.0.0.1:3000');

    // Adds new canID to a array that is sent to server to ask the latest messages from the
    // can ids that are in array. 
    this.addNewId = function(canID) {
        this.idArray["canID"].push({ can: canID })
    };

    socket.addEventListener("message", (event) => {
        let receivedMessage = JSON.parse(event.data);
        if (receivedMessage.latestMessage) {
            this.latestMessage = receivedMessage.latestMessage;
        }
    })

    // Deletes can ID from the canID array. 
    this.deleteCan = (canID) => {
        for (let i = 0; i < this.idArray["canID"].length; i++) {
            if (this.idArray["canID"][i].can === canID) {
                this.idArray["canID"].splice(i, 1);
            }
        }

        if (this.idArray["canID"].length === 0) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    };

    // returns the latest message with correspoding can ID
    this.getLatestMessages = (canID) => {
        try {
            for (let i in this.latestMessage) {
                if (this.latestMessage[i][0].canID == canID) {
                    return this.latestMessage[i];
                }
            }
            console.warn("can't find data with ID:", canID);
            return [{
                "ID": undefined,
                "canID": canID,
                "data": 0,
                "timestamp": undefined,
                "DLC": undefined
            }]

        } catch (error) {
            console.warn(error);
            return [{
                "ID": undefined,
                "canID": canID,
                "data": 0,
                "timestamp": undefined,
                "DLC": undefined
            }]
        }
    };

    this.getIdArray = function() {
        return this.idArray;
    };
}

const serverInterface = new ServerInterface();

window.onload = () => {
    let timeDropDown = document.getElementById("xAxis");
    fetch('/loadCans')
        .then(response => response.json())
        .then((data) => {
            for (let i = 0; i < data.canList.length; i++) {
                let option = document.createElement("option");
                option.setAttribute("value", data.canList[i].canID);
                option.innerText = data.canList[i].name;
                document.getElementById("canDropDown").appendChild(option);
            }
        })

    for (let i = 0; i < 6; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", xAxisOptionArray[i]);
        option.innerHTML = xAxisOptionArray[i] + " sec";
        timeDropDown.appendChild(option);
    }
}

/**
 * Creates new chart div to "main" and creates new Chart -object to it.
 * Uses createChartElements() and createOptionElements() to create elements.
 */
function addChart() {
    let select = document.getElementById("canDropDown");
    let selectedCAN = select.value;
    let chart;
    let ticks = 1;
    let selectedTime = document.getElementById("xAxis").value;

    createChartElements(selectedCAN);

    // Creating new object for chart settings and settings charts label for corresponding CAN name
    let chartSettings = new ChartSettings();
    let chartData = chartSettings.data;
    let chartOptions = chartSettings.options;

    // selecting HTML element where the chart will be displayed
    let canvas = document.getElementsByClassName("canvas " + selectedCAN)[0];

    // Creating chart object
    chart = new Chart(canvas, {
        type: 'line',
        options: chartOptions,
        data: chartData
    });

    // Calculating X-axis labels and pushing them to chart
    let labelAmount = (selectedTime * 1000) / interval;
    let oneSec = labelAmount / selectedTime;

    for (let i = 0; i < labelAmount; i++) {
        let seconds = i / oneSec;

        if (labelAmount < 800) {
            if ((seconds % 1) === 0) {
                chart.data.labels.push(seconds);
            } else {
                chart.data.labels.push("");
            }
        } else {
            if ((seconds % 10) === 0) {
                chart.data.labels.push(seconds);
            } else {
                chart.data.labels.push("");
            }
        }
    }

    // Starting an interval that will update the chart with new data.
    let chartUpdateInterval = setInterval(() => {
        let latestMessage = serverInterface.getLatestMessages(selectedCAN);

        // for every data message from node, create new dataset to same chart
        if (chart.data.datasets.length === 0) {
            latestMessage.forEach((data) => {
                let randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

                let dataset = {
                    spanGaps: true,
                    label: data.name + " (" + data.unit + ")",
                    backgroundColor: randomColor,
                    borderColor: randomColor,
                    borderWidth: 2,
                    hoverBackgroundColor: randomColor,
                    hoverBorderColor: randomColor,
                    data: []
                }
                chart.data.datasets.push(dataset);
            })
        }
        try {

            updateChart(latestMessage, chart, ticks, labelAmount, oneSec);
        } catch (error) {
            clearInterval(chartUpdateInterval);
            console.error(error);
        }
        lastMessage = latestMessage;
        ticks++;
    }, interval);
}


/**
 * @brief Creating HTML elements for chart
 * @param selectedCAN {string} name of the selected CAN
 */
function createChartElements(selectedCAN) {
    let select = document.getElementById("canDropDown");
    let selectedName = select.options[select.selectedIndex].text;

    // Creating Div element where all other elements will be created
    const dataDiv = document.createElement("div");
    dataDiv.setAttribute("id", document.getElementById("canDropDown").value);
    dataDiv.setAttribute("class", "chartDiv " + selectedCAN);

    // Creating header div where is name of the CAN node and button for deleting chart
    const headerDiv = document.createElement("div");
    headerDiv.setAttribute("class", "chartHeader");

    const header = document.createElement("h2");
    header.innerText = selectedName;

    const deleteButton = document.createElement("button");
    deleteButton.setAttribute("type", "button");
    deleteButton.innerText = "delete";
    deleteButton.addEventListener("click", () => {
        dataDiv.remove();
    })

    headerDiv.appendChild(deleteButton);
    headerDiv.appendChild(header);

    // Creating chart container so the chart size can be modified
    const chartContainer = document.createElement("div");
    chartContainer.setAttribute("class", "chart");

    // Creating canvas where the chart will appear
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", selectedCAN);
    canvas.setAttribute("class", "canvas " + selectedCAN);
    chartContainer.appendChild(canvas);

    // Appending elements to html page
    dataDiv.appendChild(headerDiv);
    dataDiv.appendChild(chartContainer);
    document.querySelector("main").insertBefore(dataDiv, document.getElementById("addNewChart"));
}





/**
 * @brief function updates chart data.
 * @param latestMessage {text} latest message that was received
 * @param chart {object} Chart that will be updated
 * @param ticks {int}   number that gets incremented by 1 every time chart is updated
 * @param startTime {int} amount of labels that are already in charts X-axis
 * @param oneSec {number} amount of ticks that correspond one second in X-axis
 */
function updateChart(latestMessage, chart, ticks, startTime, oneSec) {
    let label = ticks / oneSec;
    for (let i = 0; i < latestMessage.length; i++) {
        for (let j = 0; j < chart.data.datasets.length; j++) {
            if (chart.data.datasets[j].label === latestMessage[i].name + " (" + latestMessage[i].unit + ")") {
                chart.data.datasets[j].data.push(parseFloat(latestMessage[i].data.toFixed(2)));
                if (ticks > startTime) {
                    chart.data.datasets[j].data.shift();
                }
            }
        }
    }

    if (ticks >= startTime) {
        if (startTime < 800) {
            if ((label % 1 === 0)) {
                chart.data.labels.push(label);
            } else {
                chart.data.labels.push("");
            }
        } else {
            if ((label % 10 === 0)) {
                chart.data.labels.push(label);
            } else {
                chart.data.labels.push("");
            }
        }
        chart.data.labels.shift();
    }
    chart.update();
}