extends CanvasLayer

## DialogueBox — Interface de diálogos com efeito máquina de escrever e escolhas
## Rebecca's Mystery

@onready var container_panel: PanelContainer = $RootPanel
@onready var speaker_label: Label = $RootPanel/MarginContainer/VBoxContainer/SpeakerName
@onready var text_label: Label = $RootPanel/MarginContainer/VBoxContainer/DialogueText
@onready var options_container: VBoxContainer = $RootPanel/MarginContainer/VBoxContainer/OptionsContainer
@onready var continue_hint: Label = $RootPanel/MarginContainer/VBoxContainer/ContinueHint

var full_text: String = ""
var typewriter_tween: Tween
var current_options: Array = []
var is_typing: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	container_panel.visible = false
	
	DialogueManager.dialogue_started.connect(_on_dialogue_started)
	DialogueManager.dialogue_updated.connect(_on_dialogue_updated)
	DialogueManager.dialogue_ended.connect(_on_dialogue_ended)

func _on_dialogue_started(_key: String, _data: Dictionary) -> void:
	container_panel.visible = true

func _on_dialogue_updated(speaker: String, text: String, options: Array, _avatar_id: String) -> void:
	container_panel.visible = true
	speaker_label.text = speaker
	full_text = text
	current_options = options
	
	# Limpa opções anteriores
	for child in options_container.get_children():
		child.queue_free()
	
	continue_hint.visible = false
	
	# Efeito máquina de escrever
	text_label.text = ""
	text_label.visible_characters = 0
	text_label.text = full_text
	
	if typewriter_tween and typewriter_tween.is_valid():
		typewriter_tween.kill()
	
	var duration: float = clampf(full_text.length() * 0.02, 0.4, 2.0)
	is_typing = true
	typewriter_tween = create_tween()
	typewriter_tween.tween_property(text_label, "visible_ratio", 1.0, duration)
	typewriter_tween.finished.connect(_on_typing_finished)

func _unhandled_input(event: InputEvent) -> void:
	if not container_panel.visible:
		return
	
	# Se clicar enquanto digita, completa o texto instantaneamente
	if is_typing and (event.is_action_pressed("interact") or (event is InputEventMouseButton and event.is_pressed())):
		_finish_typewriter_instant()
		get_viewport().set_input_as_handled()
	# Se terminou e não há escolhas, avançar
	elif not is_typing and current_options.is_empty() and (event.is_action_pressed("interact") or (event is InputEventMouseButton and event.is_pressed())):
		DialogueManager.close_dialogue()
		get_viewport().set_input_as_handled()

func _finish_typewriter_instant() -> void:
	if typewriter_tween and typewriter_tween.is_valid():
		typewriter_tween.kill()
	text_label.visible_ratio = 1.0
	_on_typing_finished()

func _on_typing_finished() -> void:
	is_typing = false
	_populate_options()

func _populate_options() -> void:
	if current_options.is_empty():
		continue_hint.visible = true
		continue_hint.text = "Clique ou pressione [E] para continuar..."
		return
	
	continue_hint.visible = false
	
	for i in range(current_options.size()):
		var opt: Dictionary = current_options[i]
		var btn := Button.new()
		btn.text = "❯ " + opt.get("text", "")
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.add_theme_color_override("font_color", Color("#F3E9EC"))
		btn.add_theme_color_override("font_hover_color", Color("#B47A9A"))
		btn.pressed.connect(_on_option_clicked.bind(opt))
		options_container.add_child(btn)

func _on_option_clicked(opt: Dictionary) -> void:
	AudioManager.play_ui_click()
	DialogueManager.select_option(opt)

func _on_dialogue_ended() -> void:
	container_panel.visible = false
	current_options.clear()
	full_text = ""
