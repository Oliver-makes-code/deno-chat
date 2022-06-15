import Packet from "./Packet.ts"

interface S2CAccept extends Packet {
    type: "s2c",
    name: "accept"
    success: boolean
}
export default S2CAccept