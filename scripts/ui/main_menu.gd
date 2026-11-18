extends Node3D

## Menu Principal 3D de Rebecca's Mystery
## Fundo 3D com câmera suave, chuva, iluminação dark academia e botões responsivos

@onready var camera_pivot: Node3D = $CameraPivot
@onready var continue_btn: Button = $UI/MarginContainer/VBoxContainer/ButtonsVBox/ContinueButton
@onready var settings_subpanel: Control = $UI/SettingsMenu
@onready var credits_subpanel: Control = $UI/CreditsMenu

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	GameState.is_menu_open = false
	GameState.is_dialogue_active = false
	
	if continue_btn:
		continue_btn.disabled = not SaveManager.has_save_file()
	
	if settings_subpanel:
		settings_subpanel.visible = false
	if credits_subpanel:
		credits_subpanel.visible = false

func _process(delta: float) -> void:
	# Movimento cinematográfico muito lento da câmera no cenário 3D
	if camera_pivot:
		camera_pivot.rotation.y += delta * 0.04

func _on_new_game_button_pressed() -> void:
	AudioManager.play_ui_click()
	GameState.start_new_game()
	get_tree().change_scene_to_file("res://scenes/cutscenes/introduction.tscn")

func _on_continue_button_pressed() -> void:
	AudioManager.play_ui_click()
	SaveManager.load_game()

func _on_settings_button_pressed() -> void:
	AudioManager.play_ui_click()
	if settings_subpanel:
		settings_subpanel.visible = true

func _on_credits_button_pressed() -> void:
	AudioManager.play_ui_click()
	if credits_subpanel:
		credits_subpanel.visible = true

func _on_quit_button_pressed() -> void:
	AudioManager.play_ui_click()
	get_tree().quit()
