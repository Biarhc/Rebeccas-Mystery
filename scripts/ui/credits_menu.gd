extends Control

## Tela de Créditos e Documentação de Placeholders
## Rebecca's Mystery

func _ready() -> void:
	visible = false

func _on_back_button_pressed() -> void:
	AudioManager.play_ui_click()
	visible = false
