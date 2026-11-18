extends Node

## SaveManager — Gerenciador de persistência local em user://savegame.json
## Rebecca's Mystery — Godot 4.x

signal game_saved(success: bool)
signal game_loaded(success: bool)

const SAVE_PATH: String = "user://rebeccas_mystery_save.json"

func has_save_file() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

## Salva o estado atual do jogo em arquivo JSON seguro
func save_game(player_position: Vector3 = Vector3.ZERO) -> bool:
	var save_data: Dictionary = GameState.get_save_dict()
	
	if player_position != Vector3.ZERO:
		save_data["player_x"] = player_position.x
		save_data["player_y"] = player_position.y
		save_data["player_z"] = player_position.z
	
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if not file:
		push_error("Falha ao abrir arquivo para salvar: " + SAVE_PATH)
		emit_signal("game_saved", false)
		return false
	
	var json_string := JSON.stringify(save_data, "\t")
	file.store_string(json_string)
	file.close()
	
	GameState.emit_signal("notification_requested", "Progresso salvo com sucesso.", 2.5)
	emit_signal("game_saved", true)
	return true

## Carrega o arquivo salvo e restaura as variáveis no GameState
func load_game() -> bool:
	if not has_save_file():
		push_warning("Arquivo de salvamento não encontrado: " + SAVE_PATH)
		emit_signal("game_loaded", false)
		return false
	
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		push_error("Não foi possível ler o arquivo de save: " + SAVE_PATH)
		emit_signal("game_loaded", false)
		return false
	
	var content := file.get_as_text()
	file.close()
	
	var json := JSON.new()
	var error := json.parse(content)
	if error != OK or not (json.data is Dictionary):
		push_error("Arquivo de save corrompido ou formato inválido.")
		emit_signal("game_loaded", false)
		return false
	
	var data: Dictionary = json.data as Dictionary
	GameState.load_from_save_dict(data)
	
	# Troca para o nível salvo
	var target_level: String = data.get("current_level_path", "res://scenes/levels/main_corridor.tscn")
	get_tree().change_scene_to_file(target_level)
	
	emit_signal("game_loaded", true)
	GameState.emit_signal("notification_requested", "Jogo carregado com sucesso.", 2.5)
	return true

## Remove o arquivo de salvamento (se desejado resetar progresso)
func delete_save() -> void:
	if has_save_file():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))
