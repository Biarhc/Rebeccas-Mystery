extends Control

## Menu de Configurações (Áudio, Sensibilidade, Tela)
## Rebecca's Mystery

@onready var sensitivity_slider: HSlider = $Panel/VBoxContainer/SensHBox/SensSlider
@onready var volume_slider: HSlider = $Panel/VBoxContainer/VolHBox/VolSlider
@onready var fullscreen_check: CheckBox = $Panel/VBoxContainer/FullscreenCheck

func _ready() -> void:
	if sensitivity_slider:
		sensitivity_slider.value = GameState.mouse_sensitivity * 1000.0
		sensitivity_slider.value_changed.connect(_on_sens_changed)
	
	if volume_slider:
		volume_slider.value = GameState.master_volume * 100.0
		volume_slider.value_changed.connect(_on_volume_changed)
	
	if fullscreen_check:
		fullscreen_check.button_pressed = (DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN)
		fullscreen_check.toggled.connect(_on_fullscreen_toggled)

func _on_sens_changed(val: float) -> void:
	GameState.mouse_sensitivity = (val / 1000.0)

func _on_volume_changed(val: float) -> void:
	GameState.master_volume = (val / 100.0)
	var db = linear_to_db(clampf(GameState.master_volume, 0.001, 1.0))
	AudioServer.set_bus_volume_db(0, db)

func _on_fullscreen_toggled(toggled_on: bool) -> void:
	AudioManager.play_ui_click()
	if toggled_on:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)

func _on_back_button_pressed() -> void:
	AudioManager.play_ui_click()
	visible = false
