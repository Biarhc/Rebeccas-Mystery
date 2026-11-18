class_name SchoolNPC
extends Interactable

## Personagem não-jogável (NPC) com diálogos contextuais, pistas e reações
## Rebecca's Mystery

@export var character_id: String = "sophia"
@export var character_name: String = "Sophia Leal"
@export var default_dialogue_key: String = "sophia_intro"
@export var clue_override_dialogues: Dictionary = {
	"clue_torn_note": "sophia_confront_note"
}

func _ready() -> void:
	super._ready()
	prompt_message = "E — FALAR COM " + character_name

func interact(player: Node) -> void:
	super.interact(player)
	
	# Verifica se player possui pista que desbloqueia diálogo especial
	var chosen_dialogue: String = default_dialogue_key
	for required_clue in clue_override_dialogues.keys():
		if GameState.is_clue_discovered(required_clue):
			chosen_dialogue = clue_override_dialogues[required_clue]
			break
	
	# Vira o NPC em direção ao jogador suavemente
	if player is Node3D:
		var target_pos: Vector3 = (player as Node3D).global_position
		target_pos.y = global_position.y
		var look_dir := target_pos - global_position
		if look_dir.length_squared() > 0.01:
			var target_rot_y := atan2(-look_dir.x, -look_dir.z)
			var tween := create_tween()
			tween.tween_property(self, "rotation:y", target_rot_y, 0.3)
	
	DialogueManager.start_dialogue(chosen_dialogue)
