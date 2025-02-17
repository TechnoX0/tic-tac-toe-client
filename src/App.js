import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://tic-tac-toe-server-fcqn.onrender.com", {
    transports: ["websocket", "polling"],
});

const PongGame = () => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [showPath, setShowPath] = useState(false);

    useEffect(() => {
        socket.on("connect", () => {
            setPlayerId(socket.id);
        });

        // Receive game state updates
        socket.on("gameState", (state) => {
            setGameState(state);
        });

        // Clean up socket listeners on unmount
        return () => {
            socket.off("gameState");
        };
    }, []);

    // Handle paddle movement
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "w") {
                socket.emit("playerAction", { action: "move", direction: -1 });
            }
            if (e.key === "s") {
                socket.emit("playerAction", { action: "move", direction: 1 });
            }
            if (e.shiftKey && e.key.toLowerCase() === "p") {
                setShowPath((prev) => !prev);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === "w" || e.key === "s") {
                socket.emit("playerAction", { action: "stop" });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Function to predict ball path
    const predictBallPath = (ball, players, canvasWidth, canvasHeight) => {
        let x = ball.x;
        let y = ball.y;
        let vx = ball.vx;
        let vy = ball.vy;
        const radius = ball.radius;
        const maxSteps = 500; // Limit the number of steps to avoid infinite loops

        const path = [];

        for (let i = 0; i < maxSteps; i++) {
            x += vx;
            y += vy;

            // Wall collisions
            if (y - radius <= 0 || y + radius >= canvasHeight) {
                vy *= -1; // Reverse Y direction
            }

            // Paddle collision
            Object.values(players).forEach((player) => {
                if (
                    x - radius <= player.x + player.width &&
                    x + radius >= player.x &&
                    y >= player.y &&
                    y <= player.y + player.height
                ) {
                    vx *= -1; // Reverse X direction
                }
            });

            path.push({ x, y });

            // If the ball is past the paddles, stop prediction
            if (x - radius < 0 || x + radius > canvasWidth) break;
        }

        return path;
    };

    // Render the game state
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles
        Object.values(gameState.players).forEach((player) => {
            console.log(player.id, playerId);
            ctx.fillStyle = player.id === playerId ? "green" : "blue";
            ctx.fillRect(player.x, player.y, player.width, player.height);
        });

        // Draw ball
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(
            gameState.ball.x,
            gameState.ball.y,
            gameState.ball.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Calculate predicted path
        const path = predictBallPath(
            gameState.ball,
            gameState.players,
            canvas.width,
            canvas.height
        );

        // Draw the predicted path as a dashed line
        if (showPath) {
            ctx.strokeStyle = "red";
            ctx.setLineDash([5, 5]); // Dashed line
            ctx.beginPath();
            ctx.moveTo(gameState.ball.x, gameState.ball.y);
            path.forEach((point) => ctx.lineTo(point.x, point.y));
            ctx.stroke();
            ctx.setLineDash([]); // Reset line style
        }
    }, [gameState, playerId]);

    return (
        <div className="flex flex-col w-full h-screen">
            <header>
                <h1 className="text-lg">Multiplayer Pong Game</h1>
                <div>
                    <p>Left: {gameState?.scores.left}</p>
                    <p>Right: {gameState?.scores.right}</p>
                </div>
            </header>
            <main className="grid place-items-center h-full">
                <canvas
                    ref={canvasRef}
                    width={1000}
                    height={600}
                    style={{
                        border: "1px solid white",
                        backgroundColor: "black",
                    }}
                />
            </main>
        </div>
    );
};

export default PongGame;
