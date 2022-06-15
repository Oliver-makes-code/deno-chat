import Packet from "./Packet.ts"

interface C2SChat extends Packet {
    type: "c2s",
    name: "chat"
    message: string
}
export default C2SChat