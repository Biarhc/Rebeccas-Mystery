extends Node

## DialogueManager — Gerenciador do sistema de diálogos ramificados e escolhas
## Rebecca's Mystery — Godot 4.x

signal dialogue_started(dialogue_key: String, dialogue_data: Dictionary)
signal dialogue_updated(speaker: String, text: String, options: Array, avatar_id: String)
signal dialogue_ended()

var current_dialogue_key: String = ""
var current_dialogue_data: Dictionary = {}
var is_active: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func start_dialogue(key: String) -> void:
	if not GameState.all_dialogues_data.has(key):
		push_warning("Chave de diálogo não encontrada: " + key)
		return
	
	current_dialogue_key = key
	current_dialogue_data = GameState.all_dialogues_data[key]
	is_active = true
	GameState.is_dialogue_active = true
	
	# Libera o cursor para escolher respostas
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	
	emit_signal("dialogue_started", key, current_dialogue_data)
	_show_current_step()

func _show_current_step() -> void:
	if current_dialogue_data.is_empty():
		close_dialogue()
		return
	
	var speaker: String = current_dialogue_data.get("speaker", "Rabecca")
	var text: String = current_dialogue_data.get("text", "")
	var raw_options: Array = current_dialogue_data.get("options", [])
	var avatar_id: String = current_dialogue_data.get("avatar", "")
	
	# Filtra opções disponíveis de acordo com pré-requisitos de pistas
	var available_options: Array = []
	for opt in raw_options:
		if _is_option_valid(opt):
			available_options.append(opt)
	
	# Processa efeitos automáticos deste nó (avanço de tempo e diário)
	if current_dialogue_data.has("advance_time_minutes"):
		var minutes: int = int(current_dialogue_data["advance_time_minutes"])
		GameState.advance_time(minutes)
	
	if current_dialogue_data.has("diary_entry"):
		GameState.add_diary_entry(current_dialogue_data["diary_entry"])
	
	emit_signal("dialogue_updated", speaker, text, available_options, avatar_id)

func _is_option_valid(option_dict: Dictionary) -> bool:
	if not option_dict.has("conditions"):
		return true
	
	var conditions: Dictionary = option_dict["conditions"]
	if conditions.has("has_clue"):
		var req_clue: String = conditions["has_clue"]
		if not GameState.is_clue_discovered(req_clue):
			return false
	
	return true

func select_option(option_dict: Dictionary) -> void:
	var feedback_msg: String = option_dict.get("feedback_message", "")
	var choice_id: String = option_dict.get("id", "")
	
	if choice_id != "":
		GameState.register_choice(choice_id, feedback_msg)
	
	# Aplica efeitos de relacionamento
	if option_dict.has("relationship_effects"):
		var rel_effects: Dictionary = option_dict["relationship_effects"]
		for char_id in rel_effects.keys():
			var stats: Dictionary = rel_effects[char_id]
			for stat in stats.keys():
				var delta: int = int(stats[stat])
				GameState.modify_relationship(char_id, stat, delta)
	
	var next_key = option_dict.get("next_dialogue", null)
	if next_key != null and str(next_key) != "" and GameState.all_dialogues_data.has(str(next_key)):
		current_dialogue_key = str(next_key)
		current_dialogue_data = GameState.all_dialogues_data[current_dialogue_key]
		_show_current_step()
	else:
		close_dialogue()

func close_dialogue() -> void:
	is_active = false
	GameState.is_dialogue_active = false
	current_dialogue_data = {}
	
	# Retoma mouse capturado se nenhum outro menu estiver aberto
	if not GameState.is_menu_open:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	
	emit_signal("dialogue_ended")
