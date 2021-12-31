const GRID_SIZE = 3;
const socket = io();
const {code, username} = Qs.parse(location.search, {ignoreQueryPrefix: true});
socket.emit("playerJoin", code, username);
let playerSymbol;

function gameFinished(turnNumber) {
    let turn = (turnNumber % 2) !== 0 ? "X" : "O";
    let finished = false;
    for (let i=1; i<GRID_SIZE+1; i++) {
        if (checkLine("row" + i, turn) || checkLine("column" + i, turn)) {
            winnerFound(turn);
            finished = true;
            break;
        }
    }
    if (checkLine("diagonal" + 1, turn) || checkLine("diagonal" + 2, turn)) {
        winnerFound(turn);
        finished = true;
    }
    else if (turnNumber === 9) {
        tieFound(turn);
        finished = true;
    }
    return finished;
}

function checkLine(classname, turnSymbol) {
    let line = true;
    document.querySelectorAll( "." + classname).forEach((space) => {
        if (space.innerHTML !== turnSymbol) {
            line = false;
        }
    });
    return line;
}

function winnerFound(turn) {
    alert("Player " + turn + " has won the game!");
    clearGrid();
    if (turn !== "X" && playerSymbol !== "X") removeListeners();
    else if (turn !== "X") addListeners();
}

function tieFound(turn) {
    alert("The game has ended in a tie");
    clearGrid();
    if (turn !== "X" && playerSymbol !== "X") removeListeners();
    else if (turn !== "X") addListeners();
}

function clearGrid() {
    document.querySelectorAll(".gridspace").forEach((space) => {
        space.innerHTML="";
    });
    document.querySelector("#turn").innerHTML = "X";
}

function addListeners() {
    document.querySelectorAll(".gridspace").forEach((space) => {
        space.addEventListener("click", () => {
            if (space.innerHTML !== "X" && space.innerHTML !== "O") {
                socket.emit("fillSpace", space.id);
            }
        });
        space.addEventListener("mouseover", () => {
            if (space.innerHTML === "") {
                space.innerHTML= `<a style="opacity: 50%" class="temp">${playerSymbol}</a>`;
            }
        });

        space.addEventListener("mouseleave", () => {
            if (space.innerHTML !== "X" && space.innerHTML !== "O") {
                space.innerHTML = "";
            }
        });
    });
}

function removeListeners() {
    document.querySelectorAll(".gridspace").forEach((space) => {
        const new_element = space.cloneNode(true);
        space.parentNode.replaceChild(new_element, space);
    });
}

function addChatElement(text) {
    const chatElem = document.createElement("p");
    chatElem.style.backgroundColor = "rgb(228,228,253)";
    chatElem.style.padding = "0.5rem";
    chatElem.style.marginBottom = "0.5rem";
    chatElem.style.borderRadius = "0.5rem";
    chatElem.innerHTML= text;
    document.getElementById("chatbox").appendChild(chatElem);
}

socket.on("playerConnected", (symbol) => {
    playerSymbol = symbol;
    document.getElementById("player-label").innerHTML += " " + playerSymbol;
});

socket.on("spaceUpdated", (turnNumber, spaceID) => {
    let turn = document.getElementById("turn").innerText;
    document.getElementById(spaceID).innerHTML = turn;
    document.getElementById("turn").innerHTML = turn === "X" ? "O" : "X";
    if (!gameFinished(turnNumber)) {
        if (turn === playerSymbol) removeListeners();
        else addListeners();
    }
    else {
        socket.emit("gameFinished");
    }
});

socket.on("gameStart", () => {
    //document.getElementById("player-label").innerHTML = `You are player ${playerSymbol}`;
    document.getElementById("turn-label").classList.remove("hidden");
    document.getElementById("waiting-label").classList.add("hidden");
    if (playerSymbol === "X") addListeners();
});

socket.on("gameEnd", (user) => {
    clearGrid();
    removeListeners();
    document.getElementById("turn-label").classList.add("hidden");
    document.getElementById("waiting-label").classList.remove("hidden");
    addChatElement(`${user} has left.`)
});

socket.on("otherPlayerJoined", (otherUsername) => {
    addChatElement(`${otherUsername} has joined.`);
});

socket.on("chatReceived", (chat) => {
    addChatElement(chat);
    document.querySelector("#chatbox").scrollTo(0, document.querySelector("#chatbox").scrollHeight);
});

window.addEventListener("load", () => {
   document.getElementById("gamecode-label").innerHTML +=  " " + code;
   document.getElementById("send-btn").addEventListener("click", () => {
      let text = document.getElementById("send-input").value;
      if (text !== "") {
          document.getElementById("send-input").value = "";
          const chatMessage = `${username} says: ${text}`;
          addChatElement(chatMessage);
          document.querySelector("#chatbox").scrollTo(0, document.querySelector("#chatbox").scrollHeight);
          socket.emit("newChat", code, chatMessage);
      }
   });
    document.getElementById("send-input").addEventListener("keydown", (e) => {
       if (e.key === "Enter") {
           e.preventDefault();
           document.getElementById("send-btn").click();
       }
    });
});