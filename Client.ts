import { WebSocketClient, StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts"
import { readLines } from "https://deno.land/std@0.143.0/io/buffer.ts";
import C2SChat from "./packets/C2SChat.ts"
import S2CChat from "./packets/S2CChat.ts"
import C2SHello from "./packets/C2SHello.ts"
import S2CAccept from "./packets/S2CAccept.ts"
import Packet from "./packets/Packet.ts"

const ws: WebSocketClient = new StandardWebSocketClient("ws://127.0.0.1:8080")

ws.on("open", async () => {
    ws.send(JSON.stringify({
        type: "c2s",
        name: "hello",
        username: "Test"
    } as C2SHello))
})

ws.on("message", (message) => {
    console.log(message.data)
})

for await (const line of readLines(Deno.stdin)) {
    ws.send(JSON.stringify({
        name: "chat",
        type: "c2s",
        message: line
    } as C2SChat))
}