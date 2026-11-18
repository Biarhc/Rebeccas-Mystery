extends Control

## Painel de Pistas investigadas (TAB)
## Rebecca's Mystery

@onready var clues_list_container: VBoxContainer = $Panel/MarginContainer/HSplitContainer/LeftVBox/ScrollContainer/CluesList
@onready var title_label: Label = $Panel/MarginContainer/HSplitContainer/RightVBox/ClueTitle
@onready var quote_label: Label = $Panel/MarginContainer/HSplitContainer/RightVBox/ClueQuote
@onready var location_label: Label = $Panel/MarginContainer/HSplitContainer/RightVBox/ClueLocation
@onready var desc_label: Label = $Panel/MarginContainer/HSplitContainer/RightVBox/ClueDesc
@onready var relations_label: Label = $Panel/MarginContainer/HSplitContainer/RightVBox/ClueRelations
@onready var timeline_info_label: Label = $Panel/MarginContainer/HSplitContainer/LeftVBox/TimelineLabel
@onready var empty_hint_label: Label = $Panel/MarginContainer/HSplitContainer/LeftVBox/EmptyHint

func _ready() -> void:
	visible = false

func refresh_content() -> void:
	# Limpa lista anterior
	for child in clues_list_container.get_children():
		child.queue_free()
	
	var timeline_name: String = GameState.timeline_state
	if GameState.all_events_data.has("timelines"):
		var t_info = GameState.all_events_data["timelines"].get(timeline_name.replace("TIMELINE_", ""), {})
		if not t_info.is_empty():
			timeline_name = t_info.get("name", timeline_name)
	
	timeline_info_label.text = "Linha do Tempo: " + timeline_name
	
	var discovered = GameState.discovered_clues
	if discovered.is_empty():
		empty_hint_label.visible = true
		_clear_details()
		return
	
	empty_hint_label.visible = false
	var first_button: Button = null
	
	for clue_id in discovered.keys():
		var clue_data: Dictionary = discovered[clue_id]
		var btn := Button.new()
		btn.text = "◈ " + clue_data.get("title", clue_id)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.add_theme_color_override("font_color", Color("#F3E9EC"))
		btn.add_theme_color_override("font_hover_color", Color("#B47A9A"))
		btn.pressed.connect(_on_clue_selected.bind(clue_data))
		clues_list_container.add_child(btn)
		
		if first_button == null:
			first_button = btn
	
	if first_button:
		first_button.emit_signal("pressed")

func _on_clue_selected(data: Dictionary) -> void:
	AudioManager.play_ui_click()
	title_label.text = data.get("title", "")
	quote_label.text = data.get("quote", "")
	location_label.text = "Local: " + data.get("location", "Desconhecido")
	desc_label.text = data.get("description", "")
	
	var rels: Array = data.get("characters_related", [])
	if rels.size() > 0:
		relations_label.text = "Pessoas Relacionadas: " + ", ".join(rels).capitalize()
	else:
		relations_label.text = ""

func _clear_details() -> void:
	title_label.text = "Selecione uma pista para examinar"
	quote_label.text = ""
	location_label.text = ""
	desc_label.text = "Nenhum documento ou objeto analisado no momento."
	relations_label.text = ""

func _on_close_button_pressed() -> void:
	visible = false
	GameState.is_menu_open = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	AudioManager.play_ui_click()
