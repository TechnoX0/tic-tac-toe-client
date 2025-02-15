const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ws = new WebSocket("ws://localhost:3001");
const players = {};
let playerId = null;

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "init") {
        playerId = data.id;
        Object.assign(players, data.players);
    } else if (data.type === "update") {
        players[data.id] = { x: data.x, y: data.y };
    } else if (data.type === "remove") {
        delete players[data.id];
    }
};

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const id in players) {
        ctx.fillStyle = id === playerId ? "blue" : "red";
        ctx.fillRect(players[id].x, players[id].y, 20, 20);
    }

    requestAnimationFrame(draw); // Continuously update the canvas
}

draw(); // Start the animation loop

document.addEventListener("keydown", (event) => {
    let dx = 0,
        dy = 0;
    if (event.key === "w") dy = -5;
    if (event.key === "s") dy = 5;
    if (event.key === "a") dx = -5;
    if (event.key === "d") dx = 5;

    ws.send(JSON.stringify({ type: "move", dx, dy }));
});
