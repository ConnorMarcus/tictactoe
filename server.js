const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
let games = {};

function findGameCode(id) {
    let socketCode = undefined;
    for (let gameCode in games) {
        if (games[gameCode].playerSymbols !== undefined && id in games[gameCode].playerSymbols) {
            socketCode = gameCode;
            break;
        }
    }
    return socketCode;
}

io.on("connection", (socket) => {
    socket.on("newGameRequest", (gameCode) => {
        if (!(gameCode in games)) {
            games[gameCode] = {numPlayers: 0, turnNumber: 0, usernames: {}};
            socket.emit("gameCreation", true, gameCode);
        }
        else {
            socket.emit("gameCreation", false);
        }
    });

    socket.on("joinGameRequest", (gameCode) => {
        if ((gameCode in games) && (games[gameCode].numPlayers < 2)) {
            socket.emit("joinedGame", true, gameCode);
        }
        else {
            socket.emit("joinedGame", false);
        }
    });

    socket.on("playerJoin", (gameCode, username) => {
        //make sure server doesn't crash when url is requested directly
        if (!(gameCode in games)) {
            games[gameCode] = {numPlayers: 0, turnNumber: 0, usernames: {}};
        }
        games[gameCode].numPlayers++;
        games[gameCode].usernames[socket.id] = username;
        if (games[gameCode].playerSymbols === undefined) {
            let symbolObj = {};
            symbolObj[socket.id] = "X";
            games[gameCode].playerSymbols = symbolObj;
            socket.emit("playerConnected", "X");
        }
        else if (Object.values(games[gameCode].playerSymbols).indexOf('X') === -1) {
            games[gameCode].playerSymbols[socket.id] = "X";
            socket.emit("playerConnected", "X");
        }
        else {
            games[gameCode].playerSymbols[socket.id] = "O";
            socket.emit("playerConnected", "O");
        }

        for (let id in games[gameCode].playerSymbols) {
            if (id !== socket.id) io.to(id).emit("otherPlayerJoined", username);
        }

        if (games[gameCode].numPlayers === 2) {
            for (let id in games[gameCode].playerSymbols) {
                io.to(id).emit("gameStart");
            }
        }
    });

    socket.on("disconnect", () => {
        let gameCode = findGameCode(socket.id);
        if (gameCode !== undefined) {
            games[gameCode].numPlayers--;
            games[gameCode].turnNumber = 0;
            delete games[gameCode].playerSymbols[socket.id];
            for (let id in games[gameCode].playerSymbols) {
                io.to(id).emit("gameEnd", games[gameCode].usernames[socket.id]);
            }
            if (games[gameCode].numPlayers === 0) delete games[gameCode];
        }
    });

    socket.on("fillSpace", (spaceID) => {
        let gameCode = findGameCode(socket.id);
        games[gameCode].turnNumber++;
        for (let id in games[gameCode].playerSymbols) {
            io.to(id).emit("spaceUpdated", games[gameCode].turnNumber, spaceID);
        }
    });

    socket.on("gameFinished", () => {
        let gameCode = findGameCode(socket.id);
        games[gameCode].turnNumber = 0;
    });

    socket.on("newChat", (gameCode, chat) => {
        for (let id in games[gameCode].playerSymbols) {
            if (id !== socket.id) io.to(id).emit("chatReceived", chat);
        }
    });
});

const PORT = 3000 || process.env.PORT;
app.use(express.static(path.join(__dirname, "frontend"))); //set static folder
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));