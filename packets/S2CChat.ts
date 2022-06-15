import Packet from "./Packet.ts"

interface S2CChat extends Packet {
    type: "s2c",
    name: "chat"
    message: string
}
export default S2CChat