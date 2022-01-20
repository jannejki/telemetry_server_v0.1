var chart = [];

window.onload = () => {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let hr = today.getHours();
    let min = today.getMinutes();

    day = checkTime(day);
    month = checkTime(month);
    hr = checkTime(hr);
    min = checkTime(min);

    document.getElementById("date").value = year + "-" + month + "-" + day;
    document.getElementById("hourStart").value = hr - 1 + ":" + min;
    document.getElementById("hourEnd").value = hr + ":" + min;

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

function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
}


document.forms['addNewChartOptions'].addEventListener('submit', (event) => {
    event.preventDefault();
    let selectElement = document.getElementById("canDropDown");
    let canID = selectElement.value;
    let date = document.getElementById("date").value;
    let hourStart = document.getElementById("hourStart").value;
    let hourEnd = document.getElementById("hourEnd").value;

    let startTime2 = date + " " + hourStart;
    let endTime2 = date + " " + hourEnd;

    // TODO do something here to show user that form is being submitted
    fetch("/getHistory?can=" + canID + "&startTime=" + startTime2 + "&endTime=" + endTime2)
        .then(response => {
            console.log(response)
            switch (response.status) {
                case 404:
                    alert("No data found!");
                    return false;
                    break;
                case 500:
                    alert("Something went wrong!");
                    return false;
                    break;
                case 200:
                    return response.json();
                    break;
            }
        })
        .then((data) => {
            if (data === false) return;
            createChart(data);
        })
})

function createChart(data) {
    let select = document.getElementById("canDropDown");
    let selectedCAN = select.value;

    let startTime = data.data[0][0].time;
    let endTime = data.data[data.data.length - 1][0].time;

    // Creating new object for chart settings and settings charts label for corresponding CAN name
    let chartSettings = new ChartSettings();
    let chartData = chartSettings.data;
    let chartOptions = chartSettings.options;

    createChartElements(selectedCAN, startTime, endTime);

    // selecting HTML element where the chart will be displayed
    let canvas = document.getElementsByClassName("canvas " + selectedCAN)[0];

    chart.push(new Chart(canvas, {
        type: 'line',
        options: chartOptions,
        data: chartData
    }));

    // Creating chart object
    fillDataset(data, chart[chart.length - 1]);
}


function fillDataset(message, chart) {
    let max = 0;
    let min = message.data[0][0].data;

    dataset = {
        spanGaps: true,
        label: "",
        backgroundColor: "rgba(255,99,132,0.2)",
        borderColor: "rgba(255,99,132,1)",
        borderWidth: 2,
        hoverBackgroundColor: "rgba(255,99,132,0.4)",
        hoverBorderColor: "rgba(255,99,132,1)",
        data: []
    }
    for (let i = 0; i < message.data.length; i++) {
        let index = message.data[i][0].time.indexOf(" ");
        let index2 = message.data[i][0].time.length - 4;
        let minutes = message.data[i][0].time.slice(index, index2);
        chart.data.labels.push(minutes);
        dataset.data.push(message.data[i][0].data);

        if (message.data[i][0].data > max) {
            max = message.data[i][0].data;
        }

        if (message.data[i][0].data < min) {
            min = message.data[i][0].data;
        }

    }
    chart.options.lineTension = 0;
    chart.options.scales.y.max = max + 2;
    chart.options.scales.y.min = min - 2;
    chart.options.elements.point.radius = 3;

    dataset.label = message.data[0][0].name + " (" + message.data[0][0].unit + ")";

    chart.data.datasets.push(dataset);
    chart.update();
}

function createChartElements(selectedCAN) {
    let select = document.getElementById("canDropDown");

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

    const deleteChartBtn = document.createElement("input");
    deleteChartBtn.setAttribute("value", "delete chart");
    deleteChartBtn.setAttribute("type", "button");
    deleteChartBtn.setAttribute("class", "optionButton");

    deleteChartBtn.setAttribute("onClick", "deleteChart('" + selectedCAN + "');");

    optionsDiv.appendChild(deleteChartBtn);

    // Appending elements to html page
    dataDiv.appendChild(chartContainer);
    dataDiv.appendChild(optionsDiv);
    document.querySelector("main").insertBefore(dataDiv, document.getElementById("addNewChart"));
}

function deleteChart(chart) {
    document.getElementById(chart).remove();
}

/**
 * @brief Creating elements for optionsDiv
 * @param selectedCAN {string}
 */
function createOptionElements(selectedCAN) {
    let canDivs = document.getElementsByClassName(selectedCAN);
    let optionsDiv = canDivs[2];

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