window.onload = () => {
    refreshTable();
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
        if (response.status === 204) alert("CAN removed from database!");
    })

    refreshTable();
}

function refreshTable() {
    let table = document.getElementById("canTable");
    let tr = document.createElement("tr");
    let idTh = document.createElement("th");
    let nameTh = document.createElement("th");
    let deleteTh = document.createElement("th");
    
    idTh.innerHTML = "ID";
    nameTh.innerHTML = "Name";
    deleteTh.innerHTML = "Delete";

    tr.appendChild(idTh);
    tr.appendChild(nameTh);
    tr.appendChild(deleteTh);
    
    table.innerHTML = "";
    table.appendChild(tr);


    fetch('/loadCans')
        .then(response => response.json())
        .then((data) => {
            for (let i = 0; i < data.canList.length; i++) {
                let tr = document.createElement("tr");
                let IDtd = document.createElement("td");
                let nametd = document.createElement("td");

                IDtd.innerText = data.canList[i].CANID;
                nametd.innerText = data.canList[i].Name;

                let deletetd = document.createElement("td");
                let deleteButton = document.createElement("button");
                deleteButton.setAttribute("value", "delete");
                deleteButton.setAttribute("class", "deleteCan");
                deleteButton.setAttribute("id", data.canList[i].CANID);
                deleteButton.setAttribute("onclick", "deleteCan(this.id)");
                deleteButton.innerHTML = "Delete can";

                deletetd.appendChild(deleteButton);


                tr.appendChild(IDtd);
                tr.appendChild(nametd);
                tr.appendChild(deletetd);

                table.appendChild(tr);
            }
        })
}

document.forms['newCanForm'].addEventListener('submit', (event) => {
    event.preventDefault();
    // TODO do something here to show user that form is being submitted
    fetch(event.target.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(event.target)) // event.target is the form
    }).then((resp) => {
        if (resp.status === 500) alert("something went wrong!, CAN not saved");
        if (resp.status === 201) {
            alert("new CAN saved!");
            refreshTable();
        }
        return;
    }).then((body) => {
        // TODO handle body
    }).catch((error) => {
        // TODO handle error
    });
});