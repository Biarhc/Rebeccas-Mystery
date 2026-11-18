extends Node

## TimelineManager — Gerenciador de linhas do tempo e transições temporais
## Rebecca's Mystery — Godot 4.x

signal time_rewind_started()
signal time_rewind_completed()

func trigger_rewind_to_past() -> void:
	emit_signal("time_rewind_started")
	AudioManager.play_time_rewind()
	# Transiciona para a cena da animação de viagem no tempo
	get_tree().change_scene_to_file("res://scenes/cutscenes/time_rewind.tscn")

func enter_corridor_past() -> void:
	GameState.start_new_game()
	emit_signal("time_rewind_completed")
	get_tree().change_scene_to_file("res://scenes/levels/main_corridor.tscn")
