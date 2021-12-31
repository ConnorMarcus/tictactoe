const socket = io();

function generateCode() {
    let result = '';
    let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const length = 6;
    for (let i = length; i > 0; i--) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

window.addEventListener("load", () => {
    let usernameField = document.getElementById("username-input");
    document.getElementById("join-game-button").addEventListener("click", (e) => {
        e.preventDefault();
        if (usernameField.value !== "") {
            let code = prompt("Enter a game code:");
            socket.emit("joinGameRequest", code);
        }
    });

    document.getElementById("new-game-button").addEventListener("click", (e) => {
        e.preventDefault();
        if (usernameField.value !== "") {
            socket.emit("newGameRequest", generateCode());
        }
    });
});

socket.on("gameCreation", (created, gameCode) => {
    if (created) window.location.replace("game.html?code=" + gameCode + "&username=" + document.getElementById("username-input").value);
    else document.getElementById("new-game-button").click();
});

socket.on("joinedGame", (joined, gameCode) => {
    if (joined) window.location.replace("game.html?code=" + gameCode + "&username=" + document.getElementById("username-input").value);
    else alert("Invalid game code or game already full!");
});