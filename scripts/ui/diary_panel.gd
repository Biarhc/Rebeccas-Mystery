extends Control

## Diário Pessoal de Rabecca (Tecla J)
## Registra reflexões automáticas, pistas e desdobramentos da investigação

@onready var entries_container: VBoxContainer = $Panel/MarginContainer/VBoxContainer/ScrollContainer/EntriesList

func _ready() -> void:
	visible = false

func refresh_content() -> void:
	for child in entries_container.get_children():
		child.queue_free()
	
	var entries: Array = GameState.diary_entries
	if entries.is_empty():
		var empty_lbl := Label.new()
		empty_lbl.text = "Nenhuma anotação registrada ainda."
		empty_lbl.add_theme_color_override("font_color", Color("#B47A9A"))
		entries_container.add_child(empty_lbl)
		return
	
	for entry in entries:
		var date_str: String = entry.get("datestamp", "")
		var time_str: String = entry.get("timestamp", "")
		var content: String = entry.get("content", "")
		
		var entry_box := VBoxContainer.new()
		entry_box.add_theme_constant_override("separation", 4)
		
		var header := Label.new()
		header.text = "── %s [%s] ──" % [date_str, time_str]
		header.add_theme_color_override("font_color", Color("#B47A9A"))
		entry_box.add_child(header)
		
		var body := Label.new()
		body.text = content
		body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		body.add_theme_color_override("font_color", Color("#F3E9EC"))
		entry_box.add_child(body)
		
		var separator := HSeparator.new()
		separator.add_theme_constant_override("separation", 16)
		entry_box.add_child(separator)
		
		entries_container.add_child(entry_box)

func _on_close_button_pressed() -> void:
	visible = false
	GameState.is_menu_open = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	AudioManager.play_ui_click()
