inventory = {}

---@param id string|number
---@return void
function inventory.equip(id)
	if type(id) == "number" then
		id = tostring(id)
	end

	pcall(swf.Equip, id)
end

---@param id string|number
function inventory.equip_potion(id, desc, file, name)
	if type(id) == "number" then
		id = tostring(id)
	end

	pcall(swf.EquipPotion, id, desc, file, name)
end

-- TODO: boosts
