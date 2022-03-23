window.onload = () => {
    fetch('loadCans')
        .then(response => response.json())
        .then(data => fillDropDown(data.canList));
}

/**
 * @brief fills dropdown list where user can selet wanted can values
 * @param {array} canList 
 * @returns nothing
 */
function fillDropDown(canList) {
    canList.forEach((can) => {
        let option = document.createElement("option");
        option.setAttribute("value", can.canID);
        option.innerText = can.name;
        document.getElementById("canList").appendChild(option);
    })
}

/**
 * @brief event listener for form to prevent default submit 
 */
document.forms['convertForm'].addEventListener('submit', async(event) => {
    event.preventDefault();
    let node = document.getElementById("canList").value;
    let hex = document.getElementById("hexInput").value.toUpperCase();
    let values = await calculateValue(node, hex);
    refreshTable(values);
})


/**
 * @brief sends request to server to calculate inserted HEX string
 * @param {string} node canID to use
 * @param {string} hex hex string
 * @returns values 
 */
function calculateValue(node, hex) {
    return new Promise(resolve => {
        fetch('calculateValue/?canID=' + node + "&data=" + hex)
            .then(response => {
                if (response.status === 500) {
                    alert("Something went wrong!");
                    return { value: [{ name: "null", data: "null", unit: "null" }] };
                } else {
                    return response.json();
                }
            })
            .then(data => {
                resolve(data.value);
            });
    })
}

/**
 * @brief refreshes table with new values
 * @param {[{name: string, data: string, unit: string}]} values 
 * @returns nothing
 */
function refreshTable(values) {
    let table = document.getElementById("valueTable");
    table.innerHTML = "";

    let headerRow = document.createElement("tr");

    let nameHeader = document.createElement("th");
    nameHeader.innerText = "Name";

    let valueHeader = document.createElement("th");
    valueHeader.innerText = "Value";

    let unitHeader = document.createElement("th");
    unitHeader.innerText = "Unit";

    headerRow.appendChild(nameHeader);
    headerRow.appendChild(valueHeader);
    headerRow.appendChild(unitHeader);

    table.appendChild(headerRow);

    values.forEach((value) => {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerText = value.name;

        let valueCell = document.createElement("td");
        valueCell.innerText = value.data;

        let unitCell = document.createElement("td");
        unitCell.innerText = value.unit;

        row.appendChild(nameCell);
        row.appendChild(valueCell);
        row.appendChild(unitCell);
        table.appendChild(row);
    })
}