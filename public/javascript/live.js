function update() {
    document.getElementById("can1").style.height = "600px";
}

function addChart() {
    var chart;
    var data = {
        labels: [],
        datasets: [{
            label: "Dataset #1",
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
    let xAxisOptionArray = [10, 30, 60, 90, 120, 180];

//--------------------------------------------//
//------------Creating elements---------------//

    // Creating Div element where all other elements will be created
    const dataDiv = document.createElement("div");
    dataDiv.setAttribute("id", document.getElementById("canDropDown").value);
    dataDiv.setAttribute("class", "chartDiv");

    // Creating chart container so the chart size can be modified
    const chartContainer = document.createElement("div");
    chartContainer.setAttribute("class", "chart");

    // Creating canvas where the chart will appear
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", "myCanvas");
    chartContainer.appendChild(canvas);

    // creating options Div where will be options to operate the chart
    const optionsDiv = document.createElement("div");
    optionsDiv.setAttribute("class", "optionsDiv");

    // creating dropdown list where user can choose X axis length
    const timeDropDown = document.createElement("select");
    timeDropDown.setAttribute("name", "time");

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
    optionsDiv.appendChild(selectTime);

    //creating button for deleting the whole div
    const removeDiv = document.createElement("div");
    removeDiv.setAttribute("class", "removeDiv");

    const removeElementBtn = document.createElement("input");
    removeElementBtn.setAttribute("type", "button");
    removeElementBtn.setAttribute("value", "delete");
    removeElementBtn.setAttribute("class", "deleteChartButton");
    removeElementBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to remove this chart?")) {
            dataDiv.remove();
        }
    })
    removeDiv.appendChild(removeElementBtn);
    optionsDiv.appendChild(removeDiv);


    // Appending elements to html page
    dataDiv.appendChild(chartContainer);
    dataDiv.appendChild(optionsDiv);
    document.querySelector("main").insertBefore(dataDiv, document.getElementById("addNewChart"));


    // Creating eventListener for selecting x-axis time.
    selectTime.addEventListener("click", () => {

        //fixing dataDiv height so chart can fit to it
        dataDiv.style.height = "354px";

        //delecting timeDropdown and selectTime elements because they are no longer needed
        selectTime.remove();
        timeDropDown.remove();

        // creating text elements for highest, current and lowest values
        const currentLabel = document.createElement("label");
        currentLabel.setAttribute("for", "currentValue");
        currentLabel.innerHTML = "Current: ";

        const highestLabel = document.createElement("label");
        highestLabel.setAttribute("for", "highestValue");
        highestLabel.innerHTML = "Highest: ";

        const lowestLabel = document.createElement("label");
        lowestLabel.setAttribute("for", "lowestValue");
        lowestLabel.innerHTML = "Lowest: ";

        let currentValue = document.createElement("p");
        currentValue.setAttribute("id", "currentValue");

        let highestValue = document.createElement("p");
        highestValue.setAttribute("id", "highestValue");

        let lowestValue = document.createElement("p");
        lowestValue.setAttribute("id", "lowestValue");

        optionsDiv.appendChild(document.createElement("br"));
        optionsDiv.appendChild(highestLabel);
        optionsDiv.appendChild(highestValue);
        optionsDiv.appendChild(currentLabel);
        optionsDiv.appendChild(currentValue);
        optionsDiv.appendChild(lowestLabel);
        optionsDiv.appendChild(lowestValue);

        chart = new Chart(canvas, {
            type: 'line',
            options: options,
            data: data
        });

        console.log(timeDropDown.value);
    })
}


function updateChart(chart, label, data, lowest, highest, current) {
    console.log(data);
    if (label > 30) {
        chart.data.labels.push(label);
        chart.data.labels.shift();
    }

    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
        if (label > 30) {
            dataset.data.shift();
        }
    });
    if (data > highest.innerHTML) {
        highest.innerHTML = data;
    }
    if (data < lowest.innerHTML) {
        lowest.innerHTML = data;
    }
    current.innerHTML = data;

    chart.update();
}
