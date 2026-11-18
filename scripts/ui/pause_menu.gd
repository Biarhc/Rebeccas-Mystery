extends Control

## Menu de Pausa (Tecla ESC)
## Rebecca's Mystery

@onready var resume_btn: Button = $Panel/VBoxContainer/ResumeButton
@onready var save_btn: Button = $Panel/VBoxContainer/SaveButton
@onready var load_btn: Button = $Panel/VBoxContainer/LoadButton
@onready var settings_btn: Button = $Panel/VBoxContainer/SettingsButton
@onready var main_menu_btn: Button = $Panel/VBoxContainer/MainMenuButton
@onready var settings_subpanel: Control = $SettingsSubpanel

func _ready() -> void:
	visible = false
	if settings_subpanel:
		settings_subpanel.visible = false

func refresh_content() -> void:
	if load_btn:
		load_btn.disabled = not SaveManager.has_save_file()

func _on_resume_button_pressed() -> void:
	AudioManager.play_ui_click()
	visible = false
	GameState.is_menu_open = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _on_save_button_pressed() -> void:
	AudioManager.play_ui_click()
	var player = get_tree().get_first_node_in_group("player")
	var player_pos: Vector3 = Vector3.ZERO
	if player is Node3D:
		player_pos = (player as Node3D).global_position
	
	SaveManager.save_game(player_pos)
	if load_btn:
		load_btn.disabled = false

func _on_load_button_pressed() -> void:
	AudioManager.play_ui_click()
	SaveManager.load_game()

func _on_settings_button_pressed() -> void:
	AudioManager.play_ui_click()
	if settings_subpanel:
		settings_subpanel.visible = true

func _on_main_menu_button_pressed() -> void:
	AudioManager.play_ui_click()
	GameState.is_menu_open = false
	get_tree().change_scene_to_file("res://scenes/menus/main_menu.tscn")
