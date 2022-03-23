var chartList = [];

window.onload = () => {
    //checking current date and time to preset values for user inputs
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
    let startHr = checkTime(hr - 1);

    document.getElementById("date").value = year + "-" + month + "-" + day;
    document.getElementById("hourStart").value = startHr + ":" + min;
    document.getElementById("hourEnd").value = hr + ":" + min;

    // load CAN names and IDs from server to fill dropdown -list
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
 * @brief adds zero in front of parameter if it is less than 10.
 * @param {number} i 
 * @returns same number but if number
 */
function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
}

/** 
 * @brief event listener for addNewChartOptions form.
 * @description sends request to get the data for selected CAN and time.
 */
document.forms['addNewChartOptions'].addEventListener('submit', (event) => {
    // preveting default event
    event.preventDefault();

    let selectElement = document.getElementById("canDropDown");
    let canID = selectElement.value;
    let date = document.getElementById("date").value;
    let hourStart = document.getElementById("hourStart").value;
    let hourEnd = document.getElementById("hourEnd").value;

    // parsing start- and endtimes to the right format for server
    let startTime2 = date + " " + hourStart;
    let endTime2 = date + " " + hourEnd;

    // Sends GET request to server to get data 
    fetch("/getHistory?can=" + canID + "&startTime=" + startTime2 + "&endTime=" + endTime2)
        .then(response => {
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
            createChart(data.data);
        })
})


/**
 * @brief creates new html elements for chart and creates chart object.
 * @param {*} data 
 */
function createChart(data) {
    let chartSettings = new ChartSettings();
    let chartData = chartSettings.data;
    let chartOptions = chartSettings.options;
    let selectedCAN = document.getElementById("canDropDown").value;

    let div = document.createElement("div");
    div.setAttribute("class", "chartDiv");

    let chartDiv = document.createElement("div");
    chartDiv.setAttribute("id", selectedCAN + "div");
    chartDiv.setAttribute("class", "chart");

    let canvas = document.createElement("canvas");
    chartDiv.appendChild(canvas);
    canvas.setAttribute("id", selectedCAN);


    let rangeInputDiv = document.createElement("div");
    rangeInputDiv.setAttribute("class", "rangeInput");

    let minSlider = document.createElement("input");
    minSlider.setAttribute("type", "range");
    minSlider.setAttribute("id", "min" + selectedCAN);
    minSlider.setAttribute("class", "range");
    minSlider.setAttribute("min", 0);
    minSlider.setAttribute("max", (data.length - 1));
    minSlider.setAttribute("value", 0);

    minSlider.oninput = function() {
        sliderFunction(selectedCAN, data);
    }

    let maxSlider = document.createElement("input");
    maxSlider.setAttribute("type", "range");
    maxSlider.setAttribute("id", "max" + selectedCAN);
    maxSlider.setAttribute("class", "range");
    maxSlider.setAttribute("max", (data.length));
    maxSlider.setAttribute("min", 1);
    maxSlider.setAttribute("value", (data.length));

    maxSlider.oninput = function() {
        sliderFunction(selectedCAN, data);
    }

    rangeInputDiv.appendChild(minSlider);
    rangeInputDiv.appendChild(maxSlider);

    div.appendChild(chartDiv);
    div.appendChild(rangeInputDiv);

    document.querySelector("main").appendChild(div);

    for (let j = 0; j < data[0].length; j++) {
        let randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
        let dataset = {
            spanGaps: true,
            label: "",
            backgroundColor: randomColor,
            borderColor: randomColor,
            borderWidth: 2,
            hoverBackgroundColor: randomColor,
            hoverBorderColor: randomColor,
            data: []
        }

        for (let i = 0; i < data.length; i++) {
            let value = parseFloat(data[i][j].data);

            if (value > chartOptions.scales.y.max) {
                chartOptions.scales.y.max = (value + 2);
            }
            dataset.data.push(value);
            dataset.label = data[i][j].name;
        }
        chartData.datasets.push(dataset);
    }
    for (let i = 0; i < data.length; i++) {
        chartData.labels.push(data[i][0].time.slice(data[i][0].time.indexOf(" ")))
    }
    chartOptions.lineTension = 0;
    chartOptions.elements.point.radius = 3;
    chartOptions.scales.x.grid.display = true;

    let chart = new Chart(canvas, {
        type: 'line',
        options: chartOptions,
        data: chartData
    });
    chartList.push(chart);
}

/**
 * @brief updates chart to show only values between range inputs.
 * @param {*} canID 
 * @param {*} data 
 */
function sliderFunction(canID, data) {
    const minSlider = document.getElementById("min" + canID);
    const maxSlider = document.getElementById("max" + canID);


    for (let i = 0; i < chartList.length; i++) {
        if (chartList[i].canvas.id == canID) {

            for (let j = 0; j < data[0].length; j++) {
                let valueArray = [];
                let labelArray = [];
                for (let i = 0; i < data.length; i++) {
                    if (i >= minSlider.value && i <= maxSlider.value) {
                        let value = parseFloat(data[i][j].data);
                        valueArray.push(value);
                        labelArray.push(data[i][j].time.slice(data[i][j].time.indexOf(" ")));
                    }
                }
                chartList[i].data.datasets[j].data = valueArray;
                chartList[i].data.labels = labelArray;
            }
            chartList[i].update();
        }
    }
}