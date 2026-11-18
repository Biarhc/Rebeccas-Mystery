class_name Interactable
extends StaticBody3D

## Classe base para todos os objetos e personagens interativos em Rebecca's Mystery

@export var prompt_message: String = "E — INTERAGIR"
@export var interaction_distance: float = 3.0
@export var is_enabled: bool = true
@export var highlight_mesh: MeshInstance3D

var is_focused: bool = false

func _ready() -> void:
	add_to_group("interactables")
	# Assegura que está na camada de colisão correta
	collision_layer = 1 | 2

func get_prompt() -> String:
	return prompt_message

func on_focus_enter() -> void:
	if not is_enabled:
		return
	is_focused = true
	if highlight_mesh and highlight_mesh.material_override:
		# Feedback sutil de foco
		pass

func on_focus_exit() -> void:
	is_focused = false

func interact(_player: Node) -> void:
	if not is_enabled:
		return
	AudioManager.play_ui_click()
