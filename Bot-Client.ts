import { WebSocketClient, StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts"
import { readLines } from "https://deno.land/std@0.143.0/io/buffer.ts";
import C2SChat from "./packets/C2SChat.ts"
import S2CChat from "./packets/S2CChat.ts"
import C2SHello from "./packets/C2SHello.ts"
import S2CAccept from "./packets/S2CAccept.ts"
import Packet from "./packets/Packet.ts"

interface pkMessage {
    member?: {
        name: string
        display_name?: string
    }
}

import {
    Client,
    Message,
    GatewayIntents,
    TextChannel
} from "https://deno.land/x/harmony@v2.6.0/mod.ts"

const client = new Client()

client.on('ready', () => {
    console.log(`Ready! User: ${client.user?.tag}`)
})

client.connect(Deno.readTextFileSync("./.token"), [
    GatewayIntents.DIRECT_MESSAGES,
    GatewayIntents.GUILDS,
    GatewayIntents.GUILD_MESSAGES
])
const channelId = "986707089311297569"

var ws: WebSocketClient = new StandardWebSocketClient("wss://gambitchat.loca.lt")

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('messageCreate', async (msg: Message): Promise<void> => {
    if (msg.author.id == client.user?.id) return
    if (msg.author.bot || msg.webhookID) return
    if (msg.channel.id != channelId) return
    await sleep(100)
    var httpData: pkMessage|undefined = await (await fetch("https://api.pluralkit.me/v2/messages/"+msg.id)).json() as pkMessage
    if (!httpData) {
        ws.send(JSON.stringify({
            type: "c2s",
            name: "chat",
            message: msg.author.username + ": " + msg.content
        } as C2SChat))
    } else {
        ws.send(JSON.stringify({
            type: "c2s",
            name: "chat",
            message: (httpData.member? httpData.member!.display_name? httpData.member!.display_name!: httpData.member.name: msg.author.username) + ": " + msg.content
        } as C2SChat))
    }

})

ws.on("open", async () => {
    ws.send(JSON.stringify({
        type: "c2s",
        name: "hello",
        username: "Discord"
    } as C2SHello))
})

ws.on("message", (message) => {
    var packet = JSON.parse(message.data) as Packet
    if (packet.name == "chat") {
        var chatPacket = packet as S2CChat
        if (chatPacket.username == "Discord") return
        client.channels.fetch(channelId).then((channel) => {
            (channel as TextChannel).send(chatPacket.username + ": " + chatPacket.message)
        })
    }
})
const refresh = () => {
    ws = new StandardWebSocketClient("wss://gambitchat.loca.lt")
    ws.on("open", async () => {
        ws.send(JSON.stringify({
            type: "c2s",
            name: "hello",
            username: "Discord"
        } as C2SHello))
    })
    
    ws.on("message", (message) => {
        var packet = JSON.parse(message.data) as Packet
        if (packet.name == "chat") {
            var chatPacket = packet as S2CChat
            if (chatPacket.username == "Discord") return
            client.channels.fetch(channelId).then((channel) => {
                (channel as TextChannel).send(chatPacket.username + ": " + chatPacket.message)
            })
        }
    })
    ws.on("error", refresh)
}
ws.on("error", refresh)
