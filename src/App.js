import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://tic-tac-toe-server-fcqn.onrender.com", {
    transports: ["websocket", "polling"],
});

const App = () => {
    const canvasRef = useRef(null);
    const [playerId, setPlayerId] = useState(null);
    const [players, setPlayers] = useState({});
    const [ball, setBall] = useState({ x: 300, y: 200 }); // Ball starts in the middle
    const [ping, setPing] = useState(0);

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

        socket.on("ballUpdate", (serverBall) => {
            setBall(serverBall);
        });

        socket.on("pongResponse", (sentTime) => {
            const latency = Date.now() - sentTime;
            setPing(latency);
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Ball
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Draw Paddles
            Object.entries(players).forEach(([id, { x, y }]) => {
                ctx.fillStyle = id === playerId ? "red" : "blue";
                ctx.fillRect(x, y, 10, 80);
            });

            requestAnimationFrame(draw);
        };

        draw();
    }, [players, ball, playerId]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!playerId || !players[playerId]) return;
            let { x, y } = players[playerId];

            if (e.key === "w") y -= 10;
            if (e.key === "s") y += 10;

            // Ensure paddle stays within bounds
            y = Math.max(0, Math.min(y, 520)); // Paddle height is 80, canvas height is 600

            const newPosition = { x, y };
            setPlayers((prev) => ({ ...prev, [playerId]: newPosition }));
            socket.emit("playerMove", newPosition);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [players, playerId]);

    useEffect(() => {
        const pingInterval = setInterval(() => {
            socket.emit("pingCheck", Date.now());
        }, 1000);

        return () => clearInterval(pingInterval);
    }, []);

    return (
        <div className="grid place-items-center h-screen bg-black">
            <div className="absolute top-2 left-2 text-white font-bold bg-black p-2 rounded">
                Ping: {ping} ms
            </div>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: "1px solid white" }}
            />
        </div>
    );
};

export default App;
