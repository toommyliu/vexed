export const demoScriptName = "demo-loop";

export const demoScriptSource = `
cmd.log("Demo script started")
cmd.set_fps(30)
cmd.enable_lag_killer()
cmd.hide_players()
cmd.enable_infinite_range()

cmd.join("battleon", "Enter", "Spawn")
cmd.move_to_cell("Enter", "Spawn")
cmd.delay(500)

cmd.label("loop")
cmd.attack("*")
cmd.buff()
cmd.delay(1200)
cmd.goto_label("loop")
`.trim();
