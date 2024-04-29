combat = {}

---@return boolean
function combat.has_target()
	local ok, out = pcall(swf.HasTarget)
	if not ok then return false end

	return util.str_to_bool(out)
end

---@return number|nil
function combat.all_skills_available()
	local ok, out = pcall(swf.AllSkillAvailable)
	if not ok then return nil end

	return json.parse(out)
end

---@param index string
---@return number|nil
function combat.is_skill_available(index)
	local ok, out = pcall(swf.SkillAvailable)
	if not ok then return nil end

	return json.parse(out)
end

---@param index string
---@return number|nil
function combat.get_skill_cooldown(index)
	local ok, out = pcall(swf.GetSkillCooldown)
	if not ok then return nil end

	return json.parse(out)
end

---@return void
function combat.cancel_auto_attack()
	pcall(swf.CancelAutoAttack)
end

---@return void
function combat.cancel_target()
	pcall(swf.CancelTarget)
end

---@return void
function combat.cancel_target_self()
	pcall(swf.CancelTargetSelf)
end

---@return void
function combat.attack(name)
	if name:startswith("id'") or name:startswith("id.") or name:startswith("id:") or name:startswith("id-") then
		local sep = name:sub(3, 3)
		local mon_map_id = name:sub(4)
		swf.AttackMonsterByMonMapId(mon_map_id)
	else
		swf.AttackMonster(name)
	end
end

---@return number|nil
function combat.get_target_hp()
	local ok, out = pcall(swf.GetTargetHealth)
	if not ok then return nil end

	return json.parse(out)
end

---@return void
function combat.rest()
	pcall(swf.Rest)
end

---@return void
function combat.use_skill(index)
	pcall(swf.UseSkill, index)
end

---@return void
function combat.force_use_skill(index)
	pcall(swf.ForceUseSkill, index)
end
