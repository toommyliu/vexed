flash = {}

function flash.call_game_function(path, ...)
	if #args == 0 then
		pcall(swf.callGameFunction0(path))
	else
		local args = { ... }
		pcall(swf.callGameFunction(path, table.unpack(args)))
	end
end

function flash.get_game_object(path)
	local success, res = pcall(swf.getGameObject, path)
	if not success then return nil end

	return json.parse(res)
end

function flash.get_game_object_static(path)
	local success, res = pcall(swf.getGameObjectS, path)
	if not success then return nil end

	return json.parse(res)
end
