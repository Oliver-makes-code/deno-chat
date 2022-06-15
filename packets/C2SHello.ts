import Packet from "./Packet.ts"

interface C2SHello extends Packet {
    type: "c2s",
    name: "hello"
    username: string
}
export default C2SHello