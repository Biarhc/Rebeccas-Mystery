extends Control

## Introdução cinematográfica de Rebecca's Mystery
## Narração com transição suave de parágrafos, música atmosférica e passagem para o retrocesso temporal

@onready var narrative_label: Label = $MarginContainer/VBoxContainer/NarrativeLabel
@onready var chapter_label: Label = $MarginContainer/VBoxContainer/ChapterLabel
@onready var advance_hint: Label = $MarginContainer/VBoxContainer/AdvanceHint
@onready var fade_rect: ColorRect = $FadeRect

var paragraphs: Array[String] = [
	"Na Academia Saint Claire, uma escola exclusiva para garotas, o lema “meninas apoiam meninas” está presente em todos os cantos. Porém, por trás dos sorrisos e das amizades aparentemente perfeitas, escondem-se rivalidades, segredos e crueldades que ninguém parece querer enxergar.",
	"Rebecca sempre soube que nem tudo era o que parecia, mas nunca imaginou que presenciaria a morte de uma garota de sua própria turma.",
	"Sexta-feira, 8 de Novembro.\nO céu de outono estava pesado sob a garoa fria.\nUm silêncio súbito tomou o pátio principal. Clara Martins... uma das alunas mais sensíveis e solitárias do colégio, já não estava mais conosco.",
	"Ninguém olhava nos olhos umas das outras. As mesmas vozes que antes riam pelos corredores agora sussurravam desculpas vazias.",
	"Mas então... algo inexplicável acontece no coração de Rebecca.\nO ar estremece. O som do mundo desacelera até o silêncio absoluto.",
	"Agora, Rebecca precisa investigar o passado da garota, descobrir os segredos que a levaram àquela situação e desvendar as mentiras escondidas pelos corredores da escola.\n\nA cada descoberta, ela percebe que tentar impedir aquela tragédia será muito mais difícil do que imaginava.",
	"Porque, em um lugar onde todas fingem se apoiar...\n\nninguém é tão inocente quanto parece."
]

var current_index: int = 0
var is_transitioning: bool = false
var text_tween: Tween

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	fade_rect.color = GameState.COLOR_BG_DARK
	fade_rect.modulate.a = 1.0
	
	_show_current_paragraph(true)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_skip_to_rewind()
		get_viewport().set_input_as_handled()
	elif (event is InputEventMouseButton and event.is_pressed()) or event.is_action_pressed("interact") or event.is_action_pressed("ui_accept"):
		_advance()
		get_viewport().set_input_as_handled()

func _advance() -> void:
	if is_transitioning:
		return
	
	current_index += 1
	if current_index >= paragraphs.size():
		_finish_intro()
	else:
		_show_current_paragraph(false)

func _show_current_paragraph(is_first: bool) -> void:
	is_transitioning = true
	AudioManager.play_ui_click()
	
	if text_tween and text_tween.is_valid():
		text_tween.kill()
	
	text_tween = create_tween()
	
	if not is_first:
		text_tween.tween_property(narrative_label, "modulate:a", 0.0, 0.3)
	
	text_tween.tween_callback(func():
		narrative_label.text = paragraphs[current_index]
		chapter_label.text = "PROLÓGULO — PARTE %d DE %d" % [current_index + 1, paragraphs.size()]
	)
	
	text_tween.tween_property(narrative_label, "modulate:a", 1.0, 0.5)
	if is_first:
		text_tween.parallel().tween_property(fade_rect, "modulate:a", 0.0, 1.0)
	
	text_tween.finished.connect(func():
		is_transitioning = false
	)

func _finish_intro() -> void:
	is_transitioning = true
	var tween := create_tween()
	tween.tween_property(fade_rect, "modulate:a", 1.0, 0.8)
	tween.finished.connect(func():
		TimelineManager.trigger_rewind_to_past()
	)

func _skip_to_rewind() -> void:
	if text_tween and text_tween.is_valid():
		text_tween.kill()
	TimelineManager.trigger_rewind_to_past()
