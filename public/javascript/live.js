/**
 * @desc global variable that sets the update frequency for all interval functions. (in milliseconds)
 * @type {number}
 */
let interval = 200;         // updating charts time in milliseconds
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
 * Creates new chart div to "main" and creates new Chart -object to it.
 * Uses createChartElements() and createOptionElements() to create elements.
 */
function addChart() {
    let selectedCAN = document.getElementById("canDropDown").value;
    let chart;
    let ticks = 1;
    let getLatestMessage;

    // Creating new object for chart settings and settings charts label for corresponding CAN name
    let chartSettings = new ChartSettings();
    let chartData = chartSettings.data;
    let chartOptions = chartSettings.options;

    chartData.datasets[0].label = selectedCAN;

    createChartElements(selectedCAN);

    // Selecting HTML elements that has user input
    let timeSelectElements = document.getElementsByClassName("selectTime " + selectedCAN);
    let selectTimeButton = document.getElementsByClassName("selectTimeButton " + selectedCAN)[0];

    // Creating eventListener for selecting x-axis time.
    selectTimeButton.addEventListener("click", () => {

        //deleting timeDropdown and selectTime elements because they are no longer needed
        let selectedTime = timeSelectElements[0].value;
        timeSelectElements[1].remove();
        timeSelectElements[0].remove();

        createOptionElements(selectedCAN);

        // Creating interval that will requests new messages from server
        if (getLatestMessage === undefined) {
            getLatestMessage = setInterval(() => {
                fetchMessage(selectedCAN);
            }, interval);
        }


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
            if ((seconds % 1) === 0) {
                chart.data.labels.push(seconds);
            } else {
                chart.data.labels.push("");
            }
        }

        // Starting an interval that will update the chart with new data.
        let chartUpdateInterval = setInterval(() => {
            try {
                updateChart(selectedCAN, chart, ticks, labelAmount, oneSec);
            } catch (error) {
                clearInterval(chartUpdateInterval);
            }
            lastMessage = latestMessage;
            ticks++;
        }, interval);

    }
}


/**
 * @brief function updates chart data.
 * @param selectedCAN {text} name of the CAN that is selected
 * @param chart {object} Chart that will be updated
 * @param ticks {int}   number that gets incremented by 1 every time chart is updated
 * @param startTime {int} amount of labels that are already in charts X-axis
 * @param oneSec {number} amount of ticks that correspond one second in X-axis
 */

function updateChart(selectedCAN, chart, ticks, startTime, oneSec) {
    let optionsDiv = document.getElementsByClassName("optionsDiv " + selectedCAN);
    let highestValue = optionsDiv[1];
    let currentValue = optionsDiv[2];
    let lowestValue = optionsDiv[3];
    let label = ticks / oneSec;

    if (ticks >= startTime) {
        if ((label % 1 === 0)) {
            chart.data.labels.push(label);
        } else {
            chart.data.labels.push("");
        }
        chart.data.labels.shift();
    }

    chart.data.datasets.forEach((dataset) => {
        if (selectedCAN === latestMessage.canID) {
            dataset.data.push(latestMessage.data);
            if (ticks > startTime) {
                dataset.data.shift();
            }
        } else {
            dataset.data.push(null);
            if (ticks > startTime) {
                dataset.data.shift();
            }
        }

    });
    if (selectedCAN === latestMessage.canID) {
        if (latestMessage.data > highestValue.innerHTML) {
            highestValue.innerHTML = latestMessage.data;
        }
        if (latestMessage.data < lowestValue.innerHTML) {
            lowestValue.innerHTML = latestMessage.data;
        }
        currentValue.innerHTML = latestMessage.data;
    }
    chart.update();
}

/**
 * @brief Sends a request to server to get latest message from the car
 */
function fetchMessage(selectedCAN) {
    fetch('/updateLive/?can=' + selectedCAN)
        .then(response => response.json())
        .then((data) => {
            latestMessage = data;
            console.log(latestMessage);
        })
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

    removeButtonDiv.appendChild(removeElementBtn);
    optionsDiv.appendChild(removeButtonDiv);

    // // creating div and elements for current value
    const currentDiv = document.createElement("div");
    currentDiv.setAttribute("class", "infoDiv " + selectedCAN);

    const currentLabel = document.createElement("label");
    currentLabel.setAttribute("for", "currentValue");
    currentLabel.innerHTML = "Current: ";

    let currentValue = document.createElement("p");
    currentValue.setAttribute("id", "currentValue");
    currentValue.setAttribute("class", "optionsDiv " + selectedCAN);


    // creating div and elements for highest value
    const highestDiv = document.createElement("div");
    highestDiv.setAttribute("class", "infoDiv " + selectedCAN);

    let highestValue = document.createElement("p");
    highestValue.setAttribute("id", "highestValue");
    highestValue.setAttribute("class", "optionsDiv " + selectedCAN);

    const highestLabel = document.createElement("label");
    highestLabel.setAttribute("for", "highestValue");
    highestLabel.innerHTML = "Highest: ";


    // creating div and elements for lowest value
    const lowestDiv = document.createElement("div");
    lowestDiv.setAttribute("class", "infoDiv " + selectedCAN);

    const lowestLabel = document.createElement("label");
    lowestLabel.setAttribute("for", "lowestValue");
    lowestLabel.innerHTML = "Lowest: ";

    let lowestValue = document.createElement("p");
    lowestValue.setAttribute("id", "lowestValue");
    lowestValue.setAttribute("class", "optionsDiv " + selectedCAN);
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
 * @brief Creating HTML elements for chart
 * @param selectedCAN {string} name of the selected CAN
 */
function createChartElements(selectedCAN) {
    // Creating Div element where all other elements will be created
    const dataDiv = document.createElement("div");
    dataDiv.setAttribute("id", document.getElementById("canDropDown").value);
    dataDiv.setAttribute("class", "chartDiv " + selectedCAN);

    // Creating chart container so the chart size can be modified
    const chartContainer = document.createElement("div");
    chartContainer.setAttribute("class", "chart");

    // Creating canvas where the chart will appear
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", selectedCAN);
    canvas.setAttribute("class", "canvas " + selectedCAN);
    chartContainer.appendChild(canvas);

    // creating options Div where will be options to operate the chart
    const optionsDiv = document.createElement("div");
    optionsDiv.setAttribute("class", "optionsDiv " + selectedCAN);

    // creating dropdown list where user can choose X axis length
    const timeDropDown = document.createElement("select");
    timeDropDown.setAttribute("name", "time");
    timeDropDown.setAttribute("class", "timeDropDown selectTime " + selectedCAN);

    // Using a for-loop to create multiple choices to timeDropdown list
    for (let i = 0; i < 6; i++) {
        let option = document.createElement("option");
        option.setAttribute("value", xAxisOptionArray[i]);
        option.innerHTML = xAxisOptionArray[i] + " sec";
        timeDropDown.appendChild(option);
    }

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