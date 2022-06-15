import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import C2SChat from "./packets/C2SChat.ts"
import S2CChat from "./packets/S2CChat.ts"
import C2SHello from "./packets/C2SHello.ts"
import S2CAccept from "./packets/S2CAccept.ts"
import Packet from "./packets/Packet.ts"

var users: {
    [client: string]: WebSocketClient|undefined
} = {}

const wss = new WebSocketServer(8080);
wss.on("connection", (ws: WebSocketClient) => {
    var clientUsername: string|undefined
    ws.on("message", (message: string) => {
        var packet = JSON.parse(message) as Packet
        switch (packet.type) {
            case "s2c":
                throw new Error("Someone tried to send a s2c packet to the server!")
            default:
                switch (packet.name) {
                    case "hello":
                        var hello = packet as C2SHello
                        var { username } = hello
                        if (users[username]) {
                            if (!users[username]?.isClosed) {
                                ws.send(JSON.stringify({
                                    type: "s2c",
                                    name: "accept",
                                    success: false
                                } as S2CAccept))
                                break
                            }
                        }
                        clientUsername = username
                        users[username] = ws
                        ws.send(JSON.stringify({
                            type: "s2c",
                            name: "accept",
                            success: true
                        } as S2CAccept))
                        break
                    case "chat":
                        var chat = packet as C2SChat

                        for (var u in users) {
                            var user = users[u]
                            if (user) {
                                user.send(JSON.stringify({
                                    type: "s2c",
                                    name: "chat",
                                    username: clientUsername,
                                    message: chat.message
                                } as S2CChat))
                            }
                        }

                        ws.send(JSON.stringify({
                            type: "s2c",
                            name: "accept",
                            success: true
                        } as S2CAccept))
                        
                        break
                }
        }
    })
    ws.on("close", () => {
        if (users[clientUsername!] == ws) {
            users[clientUsername!] = undefined
        }
    })
})