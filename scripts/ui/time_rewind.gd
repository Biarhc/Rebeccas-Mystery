extends Control

## Sequência cinematográfica de retorno no tempo (Time Rewind)
## Rebecca's Mystery

@onready var clock_circle: Control = $ClockCenter
@onready var hour_hand: ColorRect = $ClockCenter/HourHand
@onready var minute_hand: ColorRect = $ClockCenter/MinuteHand
@onready var date_display: Label = $VBoxContainer/DateDisplay
@onready var time_display: Label = $VBoxContainer/TimeDisplay
@onready var status_label: Label = $VBoxContainer/StatusLabel
@onready var fade_rect: ColorRect = $FadeRect

var rewind_dates: Array[String] = [
	"SEXTA-FEIRA — 8 DE NOVEMBRO",
	"QUARTA-FEIRA — 6 DE NOVEMBRO",
	"DOMINGO — 3 DE NOVEMBRO",
	"QUINTA-FEIRA — 31 DE OUTUBRO",
	"TERÇA-FEIRA — 29 DE OUTUBRO",
	"SEXTA-FEIRA — 25 DE OUTUBRO",
	"SEGUNDA-FEIRA — 21 DE OUTUBRO",
	"QUINTA-FEIRA — 17 DE OUTUBRO",
	"SEGUNDA-FEIRA — 14 DE OUTUBRO"
]

var rewind_times: Array[String] = [
	"17:15", "16:40", "11:20", "22:15", "15:00", "09:30", "18:45", "16:10", "14:30"
]

var is_done: bool = false

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	fade_rect.modulate.a = 0.0
	AudioManager.play_time_rewind()
	_run_rewind_sequence()

func _process(delta: float) -> void:
	if not is_done:
		# Ponteiros girando no sentido anti-horário em alta velocidade
		minute_hand.rotation -= delta * 18.0
		hour_hand.rotation -= delta * 4.5

func _run_rewind_sequence() -> void:
	var total_steps: int = rewind_dates.size()
	
	for i in range(total_steps):
		date_display.text = rewind_dates[i]
		time_display.text = rewind_times[i]
		
		# Som de pulso de relógio
		if i % 2 == 0:
			AudioManager.play_ui_click()
		
		# Intervalo dinâmico desacelerando no final
		var wait_time: float = 0.12 + (float(i) / float(total_steps)) * 0.22
		await get_tree().create_timer(wait_time).timeout
	
	is_done = true
	status_label.text = "“O tempo retornou. O sino da escola tocou.”"
	AudioManager.play_school_bell()
	
	await get_tree().create_timer(1.2).timeout
	
	var tween := create_tween()
	tween.tween_property(fade_rect, "modulate:a", 1.0, 0.8)
	tween.finished.connect(func():
		TimelineManager.enter_corridor_past()
	)
