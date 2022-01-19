window.onload = () => {
    refreshCanTable();
    refreshFileTable();
}

async function deleteDbcFile(filename) {
    if (!confirm("Are you sure?")) return;
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
    refreshFileTable();
}

async function downloadDbcFile(filename) {
    await fetch('/downloadDbcFile/?filename=' + filename, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(response => {
        if (response.status === 500) alert("something went wrong!");
        if (response.status === 204) alert("file removed from database!");
        console.log(response);
    })
}

function refreshFileTable() {
    console.log("fileTable päivittetty");
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

    table.innerHTML = "";
    table.appendChild(tr);

    fetch('/loadDbcFiles')
        .then(response => response.json())
        .then((data) => {
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

                let downloadTd = document.createElement("td");
                let downloadButton = document.createElement("button");
                downloadButton.setAttribute("value", "download");
                downloadButton.setAttribute("class", "deleteCan");
                downloadButton.setAttribute("id", data.files[i].filename);
                downloadButton.setAttribute("onclick", "downloadDbcFile(this.id)");
                downloadButton.innerHTML = "Download file";
                downloadButton.disabled = true;
                downloadTd.appendChild(downloadButton);

                let inUseTd = document.createElement("td");


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
                tr.appendChild(nametd);
                tr.appendChild(downloadTd);
                tr.appendChild(deletetd);
                tr.appendChild(inUseTd);
                table.appendChild(tr);
            }
        })
}


function changeDbcFile(filename) {
    fetch('/changeDbcFile/?filename=' + filename)
        .then(response => {
            if (response.status === 204) {
                refreshFileTable();
                refreshCanTable();
            }
            if (response.status === 500) alert("Something went wrong! can't change file");
        })
}

//--------------------------------------------//
//--------------FOR CAN TABLE-----------------//

// TODO is can table useless?
/*document.forms['newCanForm'].addEventListener('submit', (event) => {
    event.preventDefault();
    // TODO do something here to show user that form is being submitted
    fetch(event.target.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(event.target)) // event.target is the form
    }).then((resp) => {
        if (resp.status === 500) alert("something went wrong!, CAN not saved");
        if (resp.status === 201) {
            alert("new CAN saved!");
            refreshCanTable();
        }
        return;
    }).then((body) => {
        // TODO handle body
    }).catch((error) => {
        // TODO handle error
    });
});*/

function refreshCanTable() {
    let table = document.getElementById("canTable");
    let tr = document.createElement("tr");

    let idTh = document.createElement("th");
    let nameTh = document.createElement("th");

    /* delete column for table deprecated 19.1.2022
    
    let deleteTh = document.createElement("th");
    deleteTh.innerHTML = "Delete";
    tr.appendChild(deleteTh);
    */

    idTh.innerHTML = "ID";
    nameTh.innerHTML = "Name";
    tr.appendChild(idTh);
    tr.appendChild(nameTh);

    table.innerHTML = "";
    table.appendChild(tr);
    fetch('/loadCans')
        .then(response => response.json())
        .then((data) => {
            for (let i = 0; i < data.canList.length; i++) {
                let tr = document.createElement("tr");
                let IDtd = document.createElement("td");
                let nametd = document.createElement("td");

                IDtd.innerText = data.canList[i].canID;
                nametd.innerText = data.canList[i].name;

                /* delete button to table, deprecated 19.1.2022

                let deletetd = document.createElement("td");
                let deleteButton = document.createElement("button");
                deleteButton.setAttribute("value", "delete");
                deleteButton.setAttribute("class", "deleteCan");
                deleteButton.setAttribute("id", data.canList[i].canID);
                deleteButton.setAttribute("onclick", "deleteCan(this.id)");
                deleteButton.innerHTML = "Delete can";

                deletetd.appendChild(deleteButton);
                tr.appendChild(deletetd);*/


                tr.appendChild(IDtd);
                tr.appendChild(nametd);

                table.appendChild(tr);
            }
        })
}

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