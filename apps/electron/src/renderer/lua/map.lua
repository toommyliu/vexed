map = {}

function map.players()
	local ok, out = pcall(swf.Players)
	if not ok then return nil end

	return json.parse(out)
end

function map.visible_monsters()
	local ok, out = pcall(swf.GetVisibleMonstersInCell)
	if not ok then return nil end

	return json.parse(out)
end

function map.monsters()
	local ok, out = pcall(swf.GetMonstersInCell)
	if not ok then return nil end

	return json.parse(out)
end

function map.reload()
	pcall(swf.ReloadMap)
end

function map.loaded()
	local ok, out = pcall(swf.MapLoadComplete)
	if not ok then return false end

	return not util.str_to_bool(out)
end

function map.cells()
	local ok, out = pcall(swf.GetCells)
	if not ok then return nil end

	return json.parse(out)
end

function map.id()
	local ok, out = pcall(swf.RoomId)
	if not ok then return nil end

	return json.parse(out)
end

function map.number()
	local ok, out = pcall(swf.RoomNumber)
	if not ok then return nil end

	return json.parse(out)
end

function map.set_spawnpoint()
	pcall(swf.SetSpawnPoint)
end


