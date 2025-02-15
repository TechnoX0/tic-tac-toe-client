import { useEffect, useState } from "react";

const ws = new WebSocket("ws://localhost:3001");

export default function App() {
    const [players, setPlayers] = useState({});
    const [playerId, setPlayerId] = useState(null);

    useEffect(() => {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            setPlayers((prev) => {
                const updated = { ...prev };
                if (data.type === "init") {
                    setPlayerId(data.id);
                    return data.players;
                } else if (data.type === "update") {
                    updated[data.id] = { x: data.x, y: data.y };
                } else if (data.type === "remove") {
                    delete updated[data.id];
                }
                return updated;
            });
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            let dx = 0,
                dy = 0;
            if (event.key === "w") dy = -5;
            if (event.key === "s") dy = 5;
            if (event.key === "a") dx = -5;
            if (event.key === "d") dx = 5;

            ws.send(JSON.stringify({ type: "move", dx, dy }));
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="relative w-screen h-screen bg-gray-900">
            {Object.entries(players).map(([id, player]) => (
                <div
                    key={id}
                    className={`absolute w-10 h-10 ${
                        id === playerId ? "bg-blue-500" : "bg-red-500"
                    } rounded`}
                    style={{ left: player.x, top: player.y }}
                />
            ))}
        </div>
    );
}
