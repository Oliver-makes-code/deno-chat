local json = require("json")

local ws, err = http.websocket("wss://gambitchat.loca.lt")
if not ws then
    return printError(err)
end
print("Type your username")
local username = read()

ws.send('{"type":"c2s","name":"hello","username":"'..username..'"}')

local w, h = term.getSize()
local currentTerm = term.current()
local historyWindow = window.create(currentTerm, 1, 1, w, h, true)
local inputWindow = window.create(currentTerm,1,h,w,1, true)
historyWindow.setCursorPos(1, h)

term.clear()

term.redirect(inputWindow)
historyWindow.restoreCursor()
inputWindow.restoreCursor()

local ok, err = pcall(parallel.waitForAny,
function ()
    local pingCount = 0
    while true do
        pingCount = pingCount + 1
        pingCount = pingCount % 400
        os.queueEvent("owo_motherfucker")
        os.pullEvent()
        if (pingCount == 0) then
            ws.send('{"type":"c2s","name":"ping"}')
        end
    end
end,
function ()
    -- Input thread --
    local message
    while true do
        message = read()
        ws.send('{"type":"c2s","name":"chat","message":"'..message..'"}')
    end
end,
function ()
    -- Message thread --
    local message
    while true do 
        pcall(parallel.waitForAny, function () 
            message = ws.receive()
            term.redirect(historyWindow)
            local parsedMessage = json.parse(message)
            if (parsedMessage == nil) then return end
            if (parsedMessage["type"] == "s2c") then
                if (parsedMessage["name"] == "chat") then
                    local username = parsedMessage["username"]
                    local chatMessage = parsedMessage["message"]
                    print(username..": "..chatMessage)
                elseif (parsedMessage["name"] == "accept") then
                    if (not parsedMessage["success"]) then 
                        error("Server denied request.")
                    end
                end
            end
        
            term.redirect(inputWindow)
        end)
    end
end)

term.redirect(currentTerm)
currentTerm.restoreCursor()
local _, h = term.getSize()
term.setCursorPos(1, h)
term.clearLine()
term.setCursorBlink(false)

ws.close()

if not ok then
    printError(err)
end