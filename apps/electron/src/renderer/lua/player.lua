player = {}

---@return number|nil
function player.id()
	local ok, out = pcall(swf.UserID)
	if not ok then return nil end

	return json.parse(out)
end

---@return table<table>|nil
function player.factions()
	local ok, out = pcall(swf.GetFactions)
	if not ok then return nil end

	return json.parse(out)
end

---@return string|nil
function player.username()
	local ok, out = pcall(swf.GetUsername)
	if not ok then return nil end

	return json.parse(out)
end

---@return string|nil
function player.password()
	local ok, out = pcall(swf.GetPassword)
	if not ok then return nil end

	return json.parse(out)
end

---@return string|nil
function player.class()
	local ok, out = pcall(swf.Class)
	if not ok then return nil end

	return json.parse(out)
end

---@return number|nil
function player.state()
	local ok, out = pcall(swf.State)
	if not ok then return nil end

	return json.parse(out)
end

---@return number|nil
function player.hp()
	local ok, out = pcall(swf.Health)
	if not ok then return nil end

	return json.parse(out)
end

---@return number|nil
function player.max_hp()
	local ok, out = pcall(swf.HealthMax)
	if not ok then return nil end

	return json.parse(out)
end

---@return number|nil
function player.mp()
	local ok, out = pcall(swf.Mana)
	if not ok then return nil end

	return json.parse(out)
end

---@return number|nil
function player.max_mp()
	local ok, out = pcall(swf.ManaMax)
	if not ok then return nil end

	return json.parse(out)
end

---@return number|nil
function player.level()
	local ok, out = pcall(swf.Level)
	if not ok then return nil end

	return json.parse(out)
end

---@return number|nil
function player.gold()
	local ok, out = pcall(swf.Gold)
	if not ok then return nil end

	return json.parse(out)
end

---@return boolean|nil
function player.is_afk()
	local ok, out = pcall(swf.IsAfk)
	if not ok then return nil end

	return util.str_to_bool(out)
end

---@return boolean|nil
function player.is_member()
	local ok, out = pcall(swf.IsMember)
	if not ok then return nil end

	return util.str_to_bool(out)
end

