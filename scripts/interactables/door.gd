class_name InteractiveDoor
extends Interactable

## Porta 3D que conecta áreas (Corredor, Sala de Aula, Biblioteca, etc.)
## Rebecca's Mystery

@export var door_name: String = "Sala de Aula 2-B"
@export var target_scene_path: String = "res://scenes/levels/classroom.tscn"
@export var target_spawn_id: String = "spawn_door"
@export var is_locked: bool = false
@export var required_clue_id: String = ""
@export var pivot_node: Node3D

var is_open: bool = false
var is_transitioning: bool = false

func _ready() -> void:
	super._ready()
	prompt_message = "E — ENTRAR EM: " + door_name

func interact(player: Node) -> void:
	if is_transitioning:
		return
	
	if is_locked:
		if required_clue_id != "" and GameState.is_clue_discovered(required_clue_id):
			is_locked = false
			GameState.emit_signal("notification_requested", "Você destrancou a porta com as informações descobertas.", 3.0)
		else:
			AudioManager.play_ui_click()
			GameState.emit_signal("notification_requested", "A porta está trancada no momento.", 2.5)
			return
	
	super.interact(player)
	_open_and_transition()

func _open_and_transition() -> void:
	is_transitioning = true
	GameState.advance_time(2) # Pequeno avanço de tempo ao mudar de sala
	
	# Animação suave da porta abrindo caso haja um pivô
	if pivot_node:
		var tween := create_tween()
		tween.tween_property(pivot_node, "rotation_degrees:y", -80.0, 0.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		await tween.finished
	
	# Salva a referência de spawn e troca de cena
	GameState.current_level_path = target_scene_path
	GameState.target_spawn_point_id = target_spawn_id
	get_tree().change_scene_to_file(target_scene_path)
