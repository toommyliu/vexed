auth = {}

---@return boolean
function auth.logged_in()
	local ok, out = pcall(swf.IsLoggedIn)
	if not ok then return false end

	return util.str_to_bool(out)
end

---@return void
function auth.logout()
	pcall(swf.Logout)
end