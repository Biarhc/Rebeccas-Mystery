extends CanvasLayer

## HUD — Interface durante exploração 3D
## Exibe mira discreta, prompt de interação (E), relógio escolar e notificações

@onready var interaction_label: Label = $CenterContainer/PromptLabel
@onready var crosshair: ColorRect = $CenterContainer/Crosshair
@onready var time_label: Label = $TopRightContainer/TimeLabel
@onready var notification_panel: PanelContainer = $NotificationContainer/NotificationPanel
@onready var notification_label: Label = $NotificationContainer/NotificationPanel/Label
@onready var clues_panel_node: Control = $CluesPanel
@onready var diary_panel_node: Control = $DiaryPanel
@onready var pause_menu_node: Control = $PauseMenu

var player_ref: PlayerController = null
var notif_tween: Tween

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	
	# Conexão com os sinais globais do GameState
	GameState.time_advanced.connect(_on_time_advanced)
	GameState.notification_requested.connect(_on_notification_requested)
	
	_update_time_display()
	interaction_label.visible = false
	notification_panel.modulate.a = 0.0

func _process(_delta: float) -> void:
	if not player_ref:
		player_ref = get_tree().get_first_node_in_group("player") as PlayerController
	
	_update_interaction_prompt()
	_handle_menu_shortcuts()

func _update_interaction_prompt() -> void:
	if GameState.is_dialogue_active or GameState.is_menu_open:
		interaction_label.visible = false
		crosshair.visible = false
		return
	
	crosshair.visible = true
	
	if player_ref:
		var interactable := player_ref.get_current_interactable()
		if interactable and interactable.is_enabled:
			interaction_label.text = interactable.get_prompt()
			interaction_label.visible = true
			return
	
	interaction_label.visible = false

func _handle_menu_shortcuts() -> void:
	if GameState.is_dialogue_active:
		return
	
	# Abrir/fechar Pistas (TAB)
	if Input.is_action_just_pressed("clues"):
		_toggle_panel("clues")
	
	# Abrir/fechar Diário (J)
	elif Input.is_action_just_pressed("diary"):
		_toggle_panel("diary")
	
	# Abrir/fechar Pausa (ESC)
	elif Input.is_action_just_pressed("pause"):
		_toggle_panel("pause")

func _toggle_panel(panel_type: String) -> void:
	var target_node: Control = null
	match panel_type:
		"clues": target_node = clues_panel_node
		"diary": target_node = diary_panel_node
		"pause": target_node = pause_menu_node
	
	if not target_node:
		return
	
	var will_open: bool = not target_node.visible
	
	# Fecha outros painéis primeiro
	clues_panel_node.visible = false
	diary_panel_node.visible = false
	pause_menu_node.visible = false
	
	target_node.visible = will_open
	GameState.is_menu_open = will_open
	
	if will_open:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		AudioManager.play_ui_click()
		if target_node.has_method("refresh_content"):
			target_node.call("refresh_content")
	else:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _on_time_advanced(_time_str: String, _date_str: String) -> void:
	_update_time_display()

func _update_time_display() -> void:
	time_label.text = "%s | %s" % [GameState.current_date, GameState.current_time]

func _on_notification_requested(text: String, duration: float) -> void:
	notification_label.text = text
	
	if notif_tween and notif_tween.is_valid():
		notif_tween.kill()
	
	notif_tween = create_tween()
	notif_tween.tween_property(notification_panel, "modulate:a", 1.0, 0.25)
	notif_tween.tween_interval(duration)
	notif_tween.tween_property(notification_panel, "modulate:a", 0.0, 0.4)
