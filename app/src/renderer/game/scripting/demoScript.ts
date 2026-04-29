export const demoScriptName = "demo-loop";

export const demoScriptSource = `
cmd.log("Demo script started")
cmd.set_fps(30)
cmd.enable_lagkiller()
cmd.enable_hideplayers()
cmd.enable_infiniterange()

cmd.join("battleon", "Enter", "Spawn")
cmd.move_to_cell("Enter", "Spawn")
cmd.delay(500)

cmd.label("loop")
cmd.attack("*")
cmd.buff()
cmd.delay(1200)
cmd.goto_label("loop")
`.trim();
