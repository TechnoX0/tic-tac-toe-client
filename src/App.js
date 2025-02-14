import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://tic-tac-toe-server-1ihj.onrender.com");

function App() {
    const [room, setRoom] = useState("");
    const [board, setBoard] = useState(Array(9).fill(""));
    const [player, setPlayer] = useState("");
    const [turn, setTurn] = useState("X");

    useEffect(() => {
        socket.on("roomCreated", (room) => {
            setPlayer("X");
            setRoom(room);
        });

        socket.on("gameStart", (game) => {
            setBoard(game.board);
            setTurn(game.turn);
        });

        socket.on("updateBoard", (game) => {
            setBoard(game.board);
            setTurn(game.turn);
        });

        socket.on("playerLeft", () => {
            alert("Opponent left the game.");
            setBoard(Array(9).fill(""));
            setRoom("");
        });
    }, []);

    const createRoom = () => {
        const roomId = prompt("Enter room name:");
        socket.emit("createRoom", roomId);
    };

    const joinRoom = () => {
        const roomId = prompt("Enter room name:");
        socket.emit("joinRoom", roomId);
        setRoom(roomId);
        setPlayer("O");
    };

    const handleMove = (index) => {
        if (board[index] === "" && player === turn) {
            socket.emit("makeMove", { room, index });
        }
    };

    return (
        <div>
            <h1>Tic-Tac-Toe Multiplayer</h1>
            {!room && (
                <div>
                    <button onClick={createRoom}>Create Room</button>
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            )}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 100px)",
                }}
            >
                {board.map((cell, index) => (
                    <div
                        key={index}
                        style={{
                            width: "100px",
                            height: "100px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid black",
                            fontSize: "2em",
                            cursor: "pointer",
                        }}
                        onClick={() => handleMove(index)}
                    >
                        {cell}
                    </div>
                ))}
            </div>
            {room && (
                <p>
                    Room: {room} | You are: {player} | Turn: {turn}
                </p>
            )}
        </div>
    );
}

export default App;
