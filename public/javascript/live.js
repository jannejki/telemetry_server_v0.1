let latestMessage;
let lastMessage = "";
let getLatestMessage;
let fetchData;
let interval = 50;         // updating charts time in milliseconds
let xAxisOptionArray = [10, 30, 60, 90, 120, 180];


function addChart() {
    let selectedCAN = document.getElementById("canDropDown").value;
    let chart;
    let label = 1;
    
    let data = {
        labels: [],
        datasets: [{
            spanGaps: true,
            label: selectedCAN,
            backgroundColor: "rgba(255,99,132,0.2)",
            borderColor: "rgba(255,99,132,1)",
            borderWidth: 2,
            hoverBackgroundColor: "rgba(255,99,132,0.4)",
            hoverBorderColor: "rgba(255,99,132,1)",
            data: []
        }]
    };
    var options = {
        animation: false,
        scales: {
            y: {
                min: 0,
                max: 45,
                stacked: true,
                grid: {
                    display: true,
                    color: "rgba(255,99,132,0.2)"
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    createChartElements(selectedCAN);
    let timeSelectElements = document.getElementsByClassName("selectTime " + selectedCAN);
    let selectTimeButton = document.getElementsByClassName("selectTimeButton " + selectedCAN)[0];

    // Creating eventListener for selecting x-axis time.
    selectTimeButton.addEventListener("click", () => {

            //deleting timeDropdown and selectTime elements because they are no longer needed
            let selectedTime = timeSelectElements[0].value;
            timeSelectElements[1].remove();
            timeSelectElements[0].remove();

            createOptionElements(selectedCAN);
            clearInterval(getLatestMessage);

            let optionsDiv = document.getElementsByClassName("optionsDiv " + selectedCAN);
            let highestValue = optionsDiv[1];
            let currentValue = optionsDiv[2];
            let lowestValue = optionsDiv[3];

            getLatestMessage = setInterval((fetchMessage), interval);

            let canvas = document.getElementsByClassName("canvas " + selectedCAN)[0];
            console.log(canvas);
            chart = new Chart(canvas, {
                type: 'line',
                options: options,
                data: data
            });

            for (let i = 0; i < selectedTime; i++) {
                chart.data.labels.push(i + 1);
            }

        setInterval(() => {
            updateChart(selectedCAN, chart, label, selectedTime, latestMessage, lowestValue, highestValue, currentValue);
            lastMessage = latestMessage;
            label++;
        }, interval);
        }
    )
}


/**
 * @brief function updates chart data.
 * @param selectedCAN
 * @param chart
 * @param label
 * @param startTime
 * @param data
 * @param lowest
 * @param highest
 * @param current
 */

function updateChart(selectedCAN, chart, label, startTime, data, lowest, highest, current) {
    if (label > startTime) {
        chart.data.labels.push(label);
        chart.data.labels.shift();
    }

    chart.data.datasets.forEach((dataset) => {
        if (selectedCAN === data.canID) {
            dataset.data.push(data.data);
            if (label > startTime) {
                dataset.data.shift();
            }
        } else {
            dataset.data.push(null);
            if (label > startTime) {
                dataset.data.shift();
            }
        }

    });
    if (selectedCAN === data.canID) {
        if (data.data > highest.innerHTML) {
            highest.innerHTML = data.data;
        }
        if (data.data < lowest.innerHTML) {
            lowest.innerHTML = data.data;
        }
        current.innerHTML = data.data;
    }
    chart.update();
}

function fetchMessage() {
    {
        fetch('/updateLive')
            .then(response => response.json())
            .then((data) => {
                latestMessage = data;
            })
    }
}


/**
 * @brief Creating elements for optionsDiv
 * @param selectedCAN
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
    removeElementBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to remove this chart?")) {
            chartDiv.remove();
        }
    });

    removeButtonDiv.appendChild(removeElementBtn);
    optionsDiv.appendChild(removeButtonDiv);

    // // creating div and elements for lowest value
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
    canvas.setAttribute("id", "myCanvas");
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