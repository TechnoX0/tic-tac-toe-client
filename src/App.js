import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

const App = () => {
    const canvasRef = useRef(null);
    const [players, setPlayers] = useState({});
    const [playerId, setPlayerId] = useState(null);

    useEffect(() => {
        socket.on("connect", () => {
            setPlayerId(socket.id);
        });

        socket.on("currentPlayers", (serverPlayers) => {
            setPlayers(serverPlayers);
        });

        socket.on("newPlayer", (newPlayer) => {
            setPlayers((prev) => ({ ...prev, [newPlayer.id]: newPlayer }));
        });

        socket.on("updatePlayer", (updatedPlayer) => {
            setPlayers((prev) => ({
                ...prev,
                [updatedPlayer.id]: updatedPlayer,
            }));
        });

        socket.on("removePlayer", (id) => {
            setPlayers((prev) => {
                const newPlayers = { ...prev };
                delete newPlayers[id];
                return newPlayers;
            });
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            Object.entries(players).forEach(([id, { x, y }]) => {
                ctx.fillStyle = id === playerId ? "red" : "blue";
                ctx.fillRect(x, y, 20, 20);
            });
            requestAnimationFrame(draw);
        };

        draw();
    }, [players, playerId]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!playerId || !players[playerId]) return;
            let { x, y } = players[playerId];
            if (e.key === "w") y -= 5;
            if (e.key === "s") y += 5;
            if (e.key === "a") x -= 5;
            if (e.key === "d") x += 5;

            const newPosition = { x, y };
            setPlayers((prev) => ({ ...prev, [playerId]: newPosition }));
            socket.emit("playerMove", newPosition);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [players, playerId]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ border: "1px solid black" }}
        />
    );
};

export default App;
