class_name ClueObject
extends Interactable

## Objeto investigável no cenário 3D que registra uma pista e atualiza o estado
## Rebecca's Mystery

@export var clue_id: String = "clue_torn_note"
@export var narrative_text: String = ""
@export var inspect_dialogue_key: String = ""
@export var hide_after_discovery: bool = false

func _ready() -> void:
	super._ready()
	prompt_message = "E — INVESTIGAR"
	
	# Se já foi descoberto anteriormente e deve sumir
	if hide_after_discovery and GameState.is_clue_discovered(clue_id):
		visible = false
		is_enabled = false

func interact(player: Node) -> void:
	if not is_enabled:
		return
	
	super.interact(player)
	
	var is_new: bool = GameState.discover_clue(clue_id)
	AudioManager.play_clue_found()
	
	if inspect_dialogue_key != "":
		DialogueManager.start_dialogue(inspect_dialogue_key)
	elif is_new:
		var clue_data: Dictionary = GameState.discovered_clues.get(clue_id, {})
		var title: String = clue_data.get("title", "Objeto Investigado")
		var desc: String = clue_data.get("description", "")
		GameState.emit_signal("notification_requested", "%s investigado." % title, 3.5)
	else:
		GameState.emit_signal("notification_requested", "Você já examinou este objeto detalhadamente.", 2.5)
	
	if hide_after_discovery:
		visible = false
		is_enabled = false
