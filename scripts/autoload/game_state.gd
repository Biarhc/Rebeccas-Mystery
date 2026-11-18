extends Node

## GameState — Gerenciamento global de estado, tempo, pistas, diário e relacionamentos.
## Rebecca's Mystery — Godot 4.x

signal clue_discovered(clue_id: String, clue_data: Dictionary)
signal diary_entry_added(entry: Dictionary)
signal relationship_changed(character_id: String, stat_name: String, new_value: int, delta: int)
signal time_advanced(current_time_str: String, current_date_str: String)
signal choice_made(choice_id: String, feedback_msg: String)
signal timeline_changed(new_timeline: String)
signal notification_requested(text: String, duration: float)

# Paleta oficial do projeto
const COLOR_BG_DARK: Color = Color("#00030E")
const COLOR_BG_SECONDARY: Color = Color("#0B0E1A")
const COLOR_PURPLE_DARK: Color = Color("#2C1B2F")
const COLOR_PURPLE_PLUM: Color = Color("#5E3A5C")
const COLOR_ROSE_DUSTY: Color = Color("#B47A9A")
const COLOR_WHITE_PINKISH: Color = Color("#F3E9EC")

# Estado da narrativa
var timeline_state: String = "TIMELINE_INITIAL"
var current_date: String = "SEGUNDA-FEIRA — 14 DE OUTUBRO"
var current_time: String = "14:30"
var in_game_hour: int = 14
var in_game_minute: int = 30
var in_game_day_name: String = "SEGUNDA-FEIRA"
var in_game_date_name: String = "14 DE OUTUBRO"

# Dados centrais
var discovered_clues: Dictionary = {}
var diary_entries: Array = []
var relationships: Dictionary = {
	"sophia": {"trust": 50, "friendship": 50, "suspicion": 15},
	"valentina": {"trust": 25, "friendship": 20, "suspicion": 40},
	"beatriz": {"trust": 35, "friendship": 40, "suspicion": 30},
	"helena": {"trust": 40, "friendship": 30, "suspicion": 20},
	"professora_elizabeth": {"trust": 60, "friendship": 50, "suspicion": 10}
}
var player_choices: Array = []
var changed_events: Array = []
var saved_conversations: Dictionary = {}

# Configurações do jogador
var mouse_sensitivity: float = 0.0025
var master_volume: float = 1.0
var music_volume: float = 0.8
var sfx_volume: float = 0.9

# Posição de trânsito e exploração
var current_level_path: String = "res://scenes/levels/main_corridor.tscn"
var target_spawn_point_id: String = ""
var is_dialogue_active: bool = false
var is_menu_open: bool = false

# Dados brutos carregados
var all_characters_data: Dictionary = {}
var all_clues_data: Dictionary = {}
var all_dialogues_data: Dictionary = {}
var all_events_data: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_input_actions()
	load_all_json_data()

## Garante que as teclas W, A, S, D, E, Tab, J, Esc e F estejam registradas
func _setup_input_actions() -> void:
	_register_action_if_missing("move_forward", KEY_W)
	_register_action_if_missing("move_backward", KEY_S)
	_register_action_if_missing("move_left", KEY_A)
	_register_action_if_missing("move_right", KEY_D)
	_register_action_if_missing("sprint", KEY_SHIFT)
	_register_action_if_missing("interact", KEY_E)
	_register_action_if_missing("clues", KEY_TAB)
	_register_action_if_missing("diary", KEY_J)
	_register_action_if_missing("pause", KEY_ESCAPE)
	_register_action_if_missing("flashlight", KEY_F)

func _register_action_if_missing(action_name: String, keycode: Key) -> void:
	if not InputMap.has_action(action_name):
		InputMap.add_action(action_name)
	
	# Verifica se já possui o evento de tecla
	var events: Array[InputEvent] = InputMap.action_get_events(action_name)
	var has_key: bool = false
	for ev in events:
		if ev is InputEventKey and (ev as InputEventKey).physical_keycode == keycode:
			has_key = true
			break
	
	if not has_key:
		var event := InputEventKey.new()
		event.physical_keycode = keycode
		InputMap.action_add_event(action_name, event)

## Carrega todos os arquivos JSON de dados
func load_all_json_data() -> void:
	all_characters_data = _read_json_file("res://data/characters.json")
	all_clues_data = _read_json_file("res://data/clues.json")
	all_dialogues_data = _read_json_file("res://data/dialogues.json")
	all_events_data = _read_json_file("res://data/events.json")

func _read_json_file(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_warning("Arquivo de dados não encontrado: " + path)
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if not file:
		return {}
	var json_str := file.get_as_text()
	var json := JSON.new()
	var error := json.parse(json_str)
	if error == OK and json.data is Dictionary:
		return json.data as Dictionary
	push_warning("Erro ao parsear JSON em: " + path)
	return {}

## Reinicia todo o estado para um Novo Jogo
func start_new_game() -> void:
	timeline_state = "TIMELINE_INITIAL"
	current_date = "SEGUNDA-FEIRA — 14 DE OUTUBRO"
	current_time = "14:30"
	in_game_hour = 14
	in_game_minute = 30
	in_game_day_name = "SEGUNDA-FEIRA"
	in_game_date_name = "14 DE OUTUBRO"
	
	discovered_clues.clear()
	diary_entries.clear()
	player_choices.clear()
	changed_events.clear()
	saved_conversations.clear()
	
	relationships = {
		"sophia": {"trust": 50, "friendship": 50, "suspicion": 15},
		"valentina": {"trust": 25, "friendship": 20, "suspicion": 40},
		"beatriz": {"trust": 35, "friendship": 40, "suspicion": 30},
		"helena": {"trust": 40, "friendship": 30, "suspicion": 20},
		"professora_elizabeth": {"trust": 60, "friendship": 50, "suspicion": 10}
	}
	
	current_level_path = "res://scenes/levels/main_corridor.tscn"
	target_spawn_point_id = "spawn_start"
	
	add_diary_entry("O que acabou de acontecer?... Eu voltei no tempo. O ar cheira a cera e chuva do lado de fora. O sino da escola acabou de soar. Desta vez, eu não vou fechar os olhos.")

## Registra descoberta de uma pista
func discover_clue(clue_id: String) -> bool:
	if discovered_clues.has(clue_id):
		return false
	
	var clue_info: Dictionary = all_clues_data.get(clue_id, {})
	if clue_info.is_empty():
		push_warning("Tentativa de descobrir pista desconhecida: " + clue_id)
		return false
	
	discovered_clues[clue_id] = clue_info
	emit_signal("clue_discovered", clue_id, clue_info)
	emit_signal("notification_requested", "Pista Descoberta: " + clue_info.get("title", "Novo Indício"), 4.0)
	
	# Adiciona reflexão no diário
	var note_text: String = "Pista investigada: %s (%s). %s" % [
		clue_info.get("title", ""),
		clue_info.get("location", ""),
		clue_info.get("quote", "")
	]
	add_diary_entry(note_text)
	
	# Verifica avanço de linha do tempo
	_check_timeline_progression()
	return true

func is_clue_discovered(clue_id: String) -> bool:
	return discovered_clues.has(clue_id)

## Adiciona uma entrada no diário
func add_diary_entry(content: String) -> void:
	var entry: Dictionary = {
		"timestamp": current_time,
		"datestamp": current_date,
		"content": content
	}
	diary_entries.append(entry)
	emit_signal("diary_entry_added", entry)

## Altera estatísticas de relacionamento
func modify_relationship(character_id: String, stat_name: String, delta: int) -> void:
	if not relationships.has(character_id):
		relationships[character_id] = {"trust": 50, "friendship": 50, "suspicion": 20}
	
	var cur_val: int = relationships[character_id].get(stat_name, 50)
	var new_val: int = clampi(cur_val + delta, 0, 100)
	relationships[character_id][stat_name] = new_val
	
	emit_signal("relationship_changed", character_id, stat_name, new_val, delta)
	_check_timeline_progression()

## Avança o tempo em minutos no jogo
func advance_time(minutes: int) -> void:
	if minutes <= 0:
		return
	
	in_game_minute += minutes
	while in_game_minute >= 60:
		in_game_minute -= 60
		in_game_hour += 1
	
	if in_game_hour >= 24:
		in_game_hour = 8 # Mantém no horário escolar
	
	current_time = "%02d:%02d" % [in_game_hour, in_game_minute]
	emit_signal("time_advanced", current_time, current_date)

## Registra escolha do jogador e emite feedback discreto
func register_choice(choice_id: String, feedback_msg: String = "") -> void:
	player_choices.append({
		"choice_id": choice_id,
		"time": current_time,
		"date": current_date
	})
	emit_signal("choice_made", choice_id, feedback_msg)
	if feedback_msg != "":
		emit_signal("notification_requested", feedback_msg, 3.5)

## Avalia e atualiza a linha do tempo ativa (A, B ou C)
func _check_timeline_progression() -> void:
	var clue_count: int = discovered_clues.size()
	var sophia_trust: int = relationships.get("sophia", {}).get("trust", 50)
	var valentina_trust: int = relationships.get("valentina", {}).get("trust", 25)
	var total_trust: int = (sophia_trust + valentina_trust) / 2
	
	var new_timeline: String = timeline_state
	if clue_count >= 4 and total_trust >= 45:
		new_timeline = "TIMELINE_C"
	elif clue_count >= 2:
		new_timeline = "TIMELINE_B"
	else:
		new_timeline = "TIMELINE_A"
	
	if new_timeline != timeline_state:
		timeline_state = new_timeline
		emit_signal("timeline_changed", timeline_state)

## Converte todo o estado em dicionário para o SaveManager
func get_save_dict() -> Dictionary:
	return {
		"timeline_state": timeline_state,
		"current_date": current_date,
		"current_time": current_time,
		"in_game_hour": in_game_hour,
		"in_game_minute": in_game_minute,
		"in_game_day_name": in_game_day_name,
		"in_game_date_name": in_game_date_name,
		"discovered_clues": discovered_clues,
		"diary_entries": diary_entries,
		"relationships": relationships,
		"player_choices": player_choices,
		"changed_events": changed_events,
		"saved_conversations": saved_conversations,
		"current_level_path": current_level_path,
		"target_spawn_point_id": target_spawn_point_id,
		"mouse_sensitivity": mouse_sensitivity,
		"master_volume": master_volume,
		"music_volume": music_volume,
		"sfx_volume": sfx_volume
	}

## Restaura o estado a partir do dicionário salvo
func load_from_save_dict(data: Dictionary) -> void:
	timeline_state = data.get("timeline_state", "TIMELINE_INITIAL")
	current_date = data.get("current_date", "SEGUNDA-FEIRA — 14 DE OUTUBRO")
	current_time = data.get("current_time", "14:30")
	in_game_hour = int(data.get("in_game_hour", 14))
	in_game_minute = int(data.get("in_game_minute", 30))
	in_game_day_name = data.get("in_game_day_name", "SEGUNDA-FEIRA")
	in_game_date_name = data.get("in_game_date_name", "14 DE OUTUBRO")
	
	discovered_clues = data.get("discovered_clues", {})
	diary_entries = data.get("diary_entries", [])
	relationships = data.get("relationships", relationships)
	player_choices = data.get("player_choices", [])
	changed_events = data.get("changed_events", [])
	saved_conversations = data.get("saved_conversations", {})
	
	current_level_path = data.get("current_level_path", "res://scenes/levels/main_corridor.tscn")
	target_spawn_point_id = data.get("target_spawn_point_id", "")
	mouse_sensitivity = float(data.get("mouse_sensitivity", 0.0025))
	master_volume = float(data.get("master_volume", 1.0))
	music_volume = float(data.get("music_volume", 0.8))
	sfx_volume = float(data.get("sfx_volume", 0.9))
	
	emit_signal("time_advanced", current_time, current_date)
	emit_signal("timeline_changed", timeline_state)
