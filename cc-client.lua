local json = require("json")
print("1")
local open_ws = function()
	local attempts, ws, err = 0, nil, 0
	while not ws do
		print("3")
		ws, err = http.websocket("wss://gambitchat.loca.lt")
		print("8", ws, err)
		if not ws then
			print("4")
			attempts = attempts + 1
			sleep(0.03)
		end
		if attempts > 30 then
			print("5")
			print('Could not connect to websocket in 30 attempts')
			return nil, (err or error("web socket connection error?"))
		end
	end
	print("6")
	return ws, nil
end
print("2")
local ws, err = open_ws()
print("7")
if not ws then
	return printError(err)
end
print("Type your username")
local username = read()

ws.send('{"type":"c2s","name":"hello","username":"' .. username .. '"}')

local w, h = term.getSize()
local currentTerm = term.current()
local historyWindow = window.create(currentTerm, 1, 1, w, h, true)
local inputWindow = window.create(currentTerm, 1, h, w, 1, true)
historyWindow.setCursorPos(1, h)

term.clear()

term.redirect(inputWindow)
historyWindow.restoreCursor()
inputWindow.restoreCursor()

local ok, err = pcall(
		parallel.waitForAny,
		function()
			while true do
				sleep(0.04)
				if not ws then
					ws = open_ws()
				end
				os.queueEvent("owo_motherfucker")
				os.pullEvent()
			end
		end,
		function()
			local pingCount = 0
			while true do
				sleep(0.04)
				pingCount = pingCount + 1
				pingCount = pingCount % 40
				os.queueEvent("owo_motherfucker")
				os.pullEvent()
				if (pingCount == 0) then
					pcall(function()
						ws.send('{"type":"c2s","name":"ping"}')
					end)
				end
			end
		end,
		function()
			-- Input thread --
			local message
			while true do
				sleep(0.04)
				message = read()
				local success, err = false, nil
				while not success do
					success, err = pcall(function()
						success, err = ws.send('{"type":"c2s","name":"chat","message":"' .. message .. '"}')
					end)
					sleep (2)
				end
			end
		end,
		function()
			-- Message thread --
			local message
			while true do
				sleep(0.04)
				pcall(
						parallel.waitForAny, function()
							message = ws.receive()
							term.redirect(historyWindow)
							local parsedMessage = json.parse(message)
							if (parsedMessage == nil) then
								return
							end
							if (parsedMessage["type"] == "s2c") then
								if (parsedMessage["name"] == "chat") then
									local username = parsedMessage["username"]
									local chatMessage = parsedMessage["message"]
									print(username .. ": " .. chatMessage)
								elseif (parsedMessage["name"] == "accept") then
									if (not parsedMessage["success"]) then
										error("Server denied request.")
									end
								end
							end

							term.redirect(inputWindow)
						end
				)
			end
		end
)

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
