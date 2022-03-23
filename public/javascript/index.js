window.onload = async(event) => {
    let nodes = await getNodes();
    createCards(nodes);
};

/**
 * creates cards to html page for every CAN node that is in the active dbc-file
 * @param {} nodes 
 */
function createCards(nodes) {
    let dashboardDiv = document.getElementById("dashboard");

    nodes.forEach((node) => {
        let card = document.createElement("div");
        card.setAttribute("class", "card");
        card.setAttribute("id", node.canID);

        let header = document.createElement("h2");
        header.innerText = node.name;

        let errorCodeDiv = document.createElement("div");
        errorCodeDiv.setAttribute("class", "messageDiv");
        errorCodeDiv.setAttribute("id", node.canID + "error")

        let messageDiv = document.createElement("div");
        messageDiv.setAttribute("class", "messageDiv");
        messageDiv.setAttribute("id", node.canID + "Message")

        card.appendChild(header);
        card.appendChild(errorCodeDiv);
        card.appendChild(messageDiv);
        dashboardDiv.appendChild(card);
    });
}

/**
 * @brief fetches all CAN nodes from active dbc file
 * @returns array of CAN nodes
 */
function getNodes() {
    return new Promise(resolve => {
        fetch('/loadCans')
            .then(response => response.json())
            .then((data) => {
                resolve(data.canList);
            })
    })
}

const cardSocket = new WebSocket('ws://127.0.0.1:3000');
//const cardSocket = new WebSocket('ws://152.70.178.116:3000');

/**
 * @brief event listener starts updating cards
 */
cardSocket.addEventListener('message', function(event) {
    const message = JSON.parse(event.data);
    if (message.latestMessage) {
        let cards = document.getElementsByClassName("card");

        // checks if there is card where message can be displayed
        message.latestMessage.forEach((message) => {
            for (let i = 0; i < cards.length; i++) {
                if (message[0].canID === cards[i].id) {
                    updateCard(message, cards[i]);
                    break;
                }
            }
        })
    }
});

/**
 * @brief Updates the card to display the messages from the car, and changes element class to "running".
 * @param {*} messages array of messages from the car
 * @param {*} card html element where hte mesage will be displayed
 */
function updateCard(messages, card) {
    card.setAttribute("class", "card running");
    card.childNodes.forEach((child) => {
        if (child.id === (messages[0].canID + "Message")) {
            child.innerHTML = "";
            for (let i = 0; i < messages.length; i++) {
                child.innerHTML = child.innerHTML +
                    '<br><h4>' + messages[i].name +
                    ':</h4><br><p>' +
                    messages[i].data.toFixed(2) + ' ' +
                    messages[i].unit + '</p>';
            }
        }
    })
}