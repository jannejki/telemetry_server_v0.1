window.onload = () => {
    refreshCanTable();
    refreshFileTable();
}

/**
 * @brief Deletes selected dbc file from database
 * @param {*} filename name of the dbc file that will be deleted
 * @returns void
 */
async function deleteDbcFile(filename) {

    // asks from user if sure to delete file
    if (!confirm("Are you sure?")) return;

    // sends request to server to delete the file
    await fetch('/deleteFile', {
            method: 'delete',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: filename })
        }).then(response => {
            if (response.status === 500) alert("something went wrong!");
            if (response.status === 204) alert("file removed from database!");
        })
        // refreshes file table
    refreshFileTable();
}


/**
 * @brief downloads the dbc file for users computer
 * @param {*} filename dbc file
 */
async function downloadDbcFile(filename) {
    await fetch('/downloadDbcFile/?filename=' + filename, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(response => {
        if (response.status === 500) alert("something went wrong!");
        if (response.status === 204) alert("file laoded from database!");
        console.log(response);
    })
}

/**
 * Refreshes file table to show the dbc files and shows which file is in use. User can change
 * the active file by clicking the "inUse" element of the table.
 * @brief refreshes file table to show all the available dbc files
 */
function refreshFileTable() {
    // creating table headers 
    let table = document.getElementById("fileTable");
    let tr = document.createElement("tr");

    let nameTh = document.createElement("th");
    let downloadTh = document.createElement("th");
    let deleteTh = document.createElement("th");
    let inUseTh = document.createElement("th");

    nameTh.innerHTML = "File";
    downloadTh.innerHTML = "Download not working";
    deleteTh.innerHTML = "Delete";
    inUseTh.innerHTML = "In use (click to change)";

    tr.appendChild(nameTh);
    tr.appendChild(downloadTh);
    tr.appendChild(deleteTh);
    tr.appendChild(inUseTh);

    // emptying the table before appending the header row
    table.innerHTML = "";
    table.appendChild(tr);

    // Sends request to server to get all the dbc files
    fetch('/loadDbcFiles')
        .then(response => response.json())
        .then((data) => {
            // creating new row for every file
            for (let i = 0; i < data.files.length; i++) {

                let tr = document.createElement("tr");
                let nametd = document.createElement("td");
                nametd.innerText = data.files[i].filename;

                let deletetd = document.createElement("td");
                let deleteButton = document.createElement("button");
                deleteButton.setAttribute("value", "delete");
                deleteButton.setAttribute("class", "deleteCan");
                deleteButton.setAttribute("id", data.files[i].filename);
                deleteButton.setAttribute("onclick", "deleteDbcFile(this.id)");
                deleteButton.innerHTML = "Delete file";

                // if file is in use, disable deleteButton
                if (data.files[i].using) deleteButton.disabled = true;
                deletetd.appendChild(deleteButton);

                // creating download button to download the file
                let downloadTd = document.createElement("td");
                let downloadButton = document.createElement("button");
                downloadButton.setAttribute("value", "download");
                downloadButton.setAttribute("class", "deleteCan");
                downloadButton.setAttribute("id", data.files[i].filename);
                downloadButton.setAttribute("onclick", "downloadDbcFile(this.id)");
                downloadButton.innerHTML = "Download file";
                downloadButton.disabled = true;
                downloadTd.appendChild(downloadButton);

                // creating cell to see if file is in use
                let inUseTd = document.createElement("td");

                // switching the innerHTML and class for the inUse cell
                switch (data.files[i].using) {
                    case true:
                        inUseTd.innerHTML = "active";
                        inUseTd.setAttribute("class", "activeFile");
                        break;
                    case false:
                        inUseTd.innerHTML = "not active";
                        inUseTd.setAttribute("class", "notActiveFile");
                        inUseTd.setAttribute("id", data.files[i].filename);
                        inUseTd.setAttribute("onclick", "changeDbcFile(this.id)");
                        break;
                }

                // appending all cells to table
                tr.appendChild(nametd);
                tr.appendChild(downloadTd);
                tr.appendChild(deletetd);
                tr.appendChild(inUseTd);
                table.appendChild(tr);
            }
        })
}


/**
 * @brief changes the active dbc file
 * @param {string} filename name of the file to use
 */
function changeDbcFile(filename) {
    // sends request to server to change active file
    fetch('/changeDbcFile/?filename=' + filename)
        .then(response => {
            // if everything went ok, refresh tables
            if (response.status === 204) {
                refreshFileTable();
                refreshCanTable();
            }
            if (response.status === 500) alert("Something went wrong! can't change file");
        })
}

/**
 * @brief refreshes can table to show the CAN ids that are in the active dbc file
 */
function refreshCanTable() {

    // creating header row
    let table = document.getElementById("canTable");
    let tr = document.createElement("tr");

    let idTh = document.createElement("th");
    let nameTh = document.createElement("th");

    idTh.innerHTML = "ID";
    nameTh.innerHTML = "Name";
    tr.appendChild(idTh);
    tr.appendChild(nameTh);

    // clearing table before appending header row in it
    table.innerHTML = "";
    table.appendChild(tr);

    // send request to get the can names and ids from the active dbc file
    fetch('/loadCans')
        .then(response => response.json())
        .then((data) => {

            // creating new row for every can
            for (let i = 0; i < data.canList.length; i++) {
                let tr = document.createElement("tr");
                let IDtd = document.createElement("td");
                let nametd = document.createElement("td");

                IDtd.innerHTML = data.canList[i].canID;
                nametd.innerHTML = data.canList[i].name;

                tr.appendChild(IDtd);
                tr.appendChild(nametd);

                table.appendChild(tr);
            }
        })
}

/**
 * @deprecated 24.1.2022
 * @param {*} canID 
 * @returns void
 */
async function deleteCan(canID) {
    if (!confirm("Are you sure?")) return;
    await fetch('/deleteCan', {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ CANID: canID })
    }).then(response => {
        if (response.status === 500) alert("something went wrong!");
        if (response.status === 204) alert("file removed from database!");
    })
    refreshCanTable();
}