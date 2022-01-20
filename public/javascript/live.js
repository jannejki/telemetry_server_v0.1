/**
 * @desc global variable that sets the update frequency for all interval functions. (in milliseconds)
 * @type {number}
 */
let interval = 10; // updating charts time in milliseconds
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
    this.idArray = { "canID": [] },
        this.interval = undefined,
        this.latestMessage = undefined,
        this.intervaltime = interval,

        // Adds new canID to a array that is sent to server to ask the latest messages from the
        // can ids that are in array. 
        this.addNewId = function(canID) {
            this.idArray["canID"].push({ can: canID })
        },

        // interval function that will be used in a interval to ask messages from server.
        this.intervalFunction = () => {
            let response = new Promise(resolve => {
                try {
                    fetch('/updateLive/?can=' + JSON.stringify(this.idArray["canID"]))
                        .then(response => response.json())
                        .then((data) => {
                            resolve(data);
                        })
                } catch (error) {
                    resolve({ null: null });
                }
            })

            response.then(values => {
                this.latestMessage = values;
            })
        },

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
        },

        // returns the latest message with correspoding can ID
        this.getLatestMessages = (canID) => {
            try {
                for (let i = 0; i < this.latestMessage.data.length; i++) {
                    if (this.latestMessage.data[i][0].canID === canID) {
                        return this.latestMessage.data[i][0];
                    }
                }

                console.warn("can't find data with ID:", canID);
                return {
                    "ID": undefined,
                    "canID": canID,
                    "data": "0",
                    "timestamp": undefined,
                    "DLC": undefined
                }

            } catch (error) {
                console.warn(error);
                return {
                    "ID": undefined,
                    "canID": canID,
                    "data": "0",
                    "timestamp": undefined,
                    "DLC": undefined
                }
            }
        },

        this.getIdArray = function() {
            return this.idArray;
        }
}

const serverInterface = new ServerInterface();

window.onload = () => {
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
    serverInterface.addNewId(selectedCAN);

    // Creating new object for chart settings and settings charts label for corresponding CAN name
    let chartSettings = new ChartSettings();
    let chartData = chartSettings.data;
    let chartOptions = chartSettings.options;
    //chartData.datasets[0].label = selectedName;

    createChartElements(selectedCAN);

    // Selecting HTML elements that has user input
    let timeSelectElements = document.getElementsByClassName("selectTime " + selectedCAN);
    let selectTimeButton = document.getElementsByClassName("selectTimeButton " + selectedCAN)[0];

    // Creating eventListener for selecting x-axis time.
    selectTimeButton.addEventListener("click", () => {

        // saving selected time from time drop down list
        let selectedTime = timeSelectElements[1].value;

        //deleting timeDropdown and selectTime elements because they are no longer needed
        while (timeSelectElements.length > 0) {
            timeSelectElements[0].remove();
        }

        // Creating elemnts to "option" div
        createOptionElements(selectedCAN);

        // Creating interval that will requests new messages from server
        if (serverInterface.interval === undefined) {
            serverInterface.interval = setInterval(serverInterface.intervalFunction, serverInterface.intervaltime);
        }


        // selecting HTML element where the chart will be displayed
        let canvas = document.getElementsByClassName("canvas " + selectedCAN)[0];

        // Creating chart object
        chart = new Chart(canvas, {
            type: 'line',
            options: chartOptions,
            data: chartData
        });

        let dataset = {
            spanGaps: true,
            label: "",
            backgroundColor: "rgba(255,99,132,0.2)",
            borderColor: "rgba(255,99,132,1)",
            borderWidth: 2,
            hoverBackgroundColor: "rgba(255,99,132,0.4)",
            hoverBorderColor: "rgba(255,99,132,1)",
            data: []
        }

        chart.data.datasets.push(dataset);



        // Calculating X-axis labels and pushing them to chart
        let labelAmount = (selectedTime * 1000) / interval;
        let oneSec = labelAmount / selectedTime;

        for (let i = 0; i < labelAmount; i++) {
            let seconds = i / oneSec;
            if ((seconds % 1) === 0) {
                chart.data.labels.push(seconds);
            } else {
                chart.data.labels.push("");
            }
        }

        // Starting an interval that will update the chart with new data.
        let tries = 0;
        let chartUpdateInterval = setInterval(() => {
            let latestMessage = serverInterface.getLatestMessages(selectedCAN);
            tries++;
            if (latestMessage.id === undefined && tries < 10) return;

            try {
                updateChart(latestMessage, chart, ticks, labelAmount, oneSec);
            } catch (error) {
                clearInterval(chartUpdateInterval);
                console.error(error);
            }
            lastMessage = latestMessage;
            ticks++;
        }, interval);


    });
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

    // Creating chart container so the chart size can be modified
    const chartContainer = document.createElement("div");
    chartContainer.setAttribute("class", "chart");

    const chartHeader = document.createElement("h3");
    chartHeader.innerHTML = selectedName;

    chartContainer.appendChild(chartHeader);
    // Creating canvas where the chart will appear
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", selectedCAN);
    canvas.setAttribute("class", "canvas " + selectedCAN);
    chartContainer.appendChild(canvas);

    // creating options Div where will be options to operate the chart
    const optionsDiv = document.createElement("div");
    optionsDiv.setAttribute("class", "optionsDiv " + selectedCAN);

    // creating dropdown list where user can choose X axis length
    const labelDiv = document.createElement("div");
    labelDiv.setAttribute("class", "labelDiv selectTime " + selectedCAN);

    const label = document.createElement("label");
    label.setAttribute("for", "timeDropDown");
    label.setAttribute("class", "optionLabel selectTime " + selectedCAN);
    label.innerHTML = "Select X-axis time:";

    const timeDropDown = document.createElement("select");
    timeDropDown.setAttribute("id", "timeDropDown");
    timeDropDown.setAttribute("name", "time");
    timeDropDown.setAttribute("class", "timeDropDown selectTime " + selectedCAN);

    // Using a for-loop to create multiple choices to timeDropdown list
    for (let i = 0; i < 6; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", xAxisOptionArray[i]);
        option.innerHTML = xAxisOptionArray[i] + " sec";
        timeDropDown.appendChild(option);
    }
    optionsDiv.appendChild(label);
    optionsDiv.appendChild(timeDropDown);

    // creating button for selecting the wanted time from dropdown list
    const selectTime = document.createElement("input");
    selectTime.setAttribute("value", "select");
    selectTime.setAttribute("type", "button");
    selectTime.setAttribute("class", "selectTimeButton selectTime " + selectedCAN);
    optionsDiv.appendChild(selectTime);

    // Appending elements to html page
    dataDiv.appendChild(chartContainer);
    dataDiv.appendChild(optionsDiv);
    document.querySelector("main").insertBefore(dataDiv, document.getElementById("addNewChart"));
}


/**
 * @brief Creating elements for optionsDiv
 * @param selectedCAN {string}
 */
function createOptionElements(selectedCAN) {
    let canDivs = document.getElementsByClassName(selectedCAN);
    let optionsDiv = canDivs[2];
    let chartDiv = canDivs[0];

    // Creating button for deleting chart.
    const removeButtonDiv = document.createElement("div");
    removeButtonDiv.setAttribute("class", "removeButtonDiv");

    const removeElementBtn = document.createElement("input");
    removeElementBtn.setAttribute("type", "button");
    removeElementBtn.setAttribute("value", "delete");
    removeElementBtn.setAttribute("class", "deleteChartButton");
    removeElementBtn.setAttribute("id", "delete" + selectedCAN + "Button");
    removeElementBtn.addEventListener("click", () => {
        document.getElementById(selectedCAN).remove();
        serverInterface.deleteCan(selectedCAN);
    });

    removeButtonDiv.appendChild(removeElementBtn);
    optionsDiv.appendChild(removeButtonDiv);

    // // creating div and elements for current value
    const currentDiv = document.createElement("div");
    currentDiv.setAttribute("class", "infoDiv " + selectedCAN);

    const currentLabel = document.createElement("label");
    currentLabel.setAttribute("for", "currentValue");
    currentLabel.setAttribute("class", "numberValuesLabel");
    currentLabel.innerHTML = "Current: ";

    let currentValue = document.createElement("p");
    currentValue.setAttribute("id", "currentValue");
    currentValue.setAttribute("class", "numberValues" + selectedCAN + " numberValues");
    currentValue.innerHTML = "0";


    // creating div and elements for highest value
    const highestDiv = document.createElement("div");
    highestDiv.setAttribute("class", "infoDiv " + selectedCAN);

    let highestValue = document.createElement("p");
    highestValue.setAttribute("id", "highestValue");
    highestValue.setAttribute("class", "numberValues" + selectedCAN + " numberValues");
    highestValue.innerHTML = "0";

    const highestLabel = document.createElement("label");
    highestLabel.setAttribute("for", "highestValue");
    highestLabel.setAttribute("class", "numberValuesLabel");
    highestLabel.innerHTML = "Highest: ";


    // creating div and elements for lowest value
    const lowestDiv = document.createElement("div");
    lowestDiv.setAttribute("class", "infoDiv " + selectedCAN);

    const lowestLabel = document.createElement("label");
    lowestLabel.setAttribute("for", "lowestValue");
    lowestLabel.setAttribute("class", "numberValuesLabel");
    lowestLabel.innerHTML = "Lowest: ";

    let lowestValue = document.createElement("p");
    lowestValue.setAttribute("id", "lowestValue");
    lowestValue.setAttribute("class", "numberValues" + selectedCAN + " numberValues");
    lowestValue.innerHTML = "99";

    highestDiv.appendChild(highestLabel);
    highestDiv.appendChild(highestValue);
    currentDiv.appendChild(currentLabel);
    currentDiv.appendChild(currentValue);
    lowestDiv.appendChild(lowestLabel);
    lowestDiv.appendChild(lowestValue);

    optionsDiv.appendChild(highestDiv);
    optionsDiv.appendChild(currentDiv);
    optionsDiv.appendChild(lowestDiv);
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
    let optionsDiv = document.getElementsByClassName("numberValues" + latestMessage.canID);
    let highestValue = optionsDiv[0];
    let currentValue = optionsDiv[1];
    let lowestValue = optionsDiv[2];
    let label = ticks / oneSec;
    let value = parseFloat(latestMessage.data).toFixed(2);
    chart.data.datasets[0].label = latestMessage.name;

    if (ticks >= startTime) {
        if ((label % 1 === 0)) {
            chart.data.labels.push(label);
        } else {
            chart.data.labels.push("");
        }
        chart.data.labels.shift();
    }

    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(value);
        if (ticks > startTime) {
            dataset.data.shift();
        }
    });

    if (parseInt(value) > parseInt(highestValue.innerHTML)) {
        chart.options.scales.y.max = parseInt(value) + 2;
        highestValue.innerHTML = value;
    }

    if (value < lowestValue.innerHTML) {
        lowestValue.innerHTML = value;
    }

    currentValue.innerHTML = value + " " + latestMessage.unit;

    chart.update();
}