class_name PlayerController
extends CharacterBody3D

## Controlador de exploração 3D da protagonista Rabecca
## Câmera em primeira pessoa, movimentação suave, lanterna e RayCast de interação

@export var walk_speed: float = 3.2
@export var sprint_speed: float = 5.2
@export var acceleration: float = 12.0
@export var friction: float = 14.0
@export var gravity: float = 18.0

@export var interaction_ray_length: float = 2.8

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D
@onready var interaction_ray: RayCast3D = $Head/Camera3D/InteractionRay
@onready var flashlight: SpotLight3D = $Head/Camera3D/Flashlight

var mouse_sensitivity: float = 0.0025
var current_interactable: Interactable = null
var footstep_timer: float = 0.0

func _ready() -> void:
	# Captura o cursor do mouse para navegação 3D
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	
	# Aplica sensibilidade das configurações
	mouse_sensitivity = GameState.mouse_sensitivity
	
	# Se houver um spawn point designado
	_position_at_spawn()

func _position_at_spawn() -> void:
	if GameState.target_spawn_point_id != "":
		var spawn_node = get_tree().get_first_node_in_group("spawns_" + GameState.target_spawn_point_id)
		if spawn_node is Node3D:
			global_position = spawn_node.global_position
			rotation.y = spawn_node.rotation.y

func _unhandled_input(event: InputEvent) -> void:
	# Se estiver em diálogo ou menu, ignora controle de câmera
	if GameState.is_dialogue_active or GameState.is_menu_open:
		return
	
	# Controle da câmera com o mouse
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var motion := event as InputEventMouseMotion
		rotate_y(-motion.relative.x * mouse_sensitivity)
		head.rotate_x(-motion.relative.y * mouse_sensitivity)
		head.rotation.x = clampf(head.rotation.x, deg_to_rad(-78.0), deg_to_rad(82.0))
	
	# Alternar Lanterna
	if event.is_action_pressed("flashlight"):
		if flashlight:
			flashlight.visible = not flashlight.visible
			AudioManager.play_ui_click()

func _physics_process(delta: float) -> void:
	# Atualiza o raycast de interação em direção ao centro da tela
	_update_interaction()
	
	# Se a protagonista estiver parada em menus/diálogos, aplica gravidade mas não move
	if GameState.is_dialogue_active or GameState.is_menu_open:
		if not is_on_floor():
			velocity.y -= gravity * delta
		else:
			velocity.x = move_toward(velocity.x, 0.0, friction * delta)
			velocity.z = move_toward(velocity.z, 0.0, friction * delta)
		move_and_slide()
		return
	
	# Gravidade
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = -0.1
	
	# Entrada de movimento
	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	var move_dir: Vector3 = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	var is_sprinting: bool = Input.is_action_pressed("sprint")
	var target_speed: float = sprint_speed if is_sprinting else walk_speed
	
	if move_dir.length() > 0.0:
		velocity.x = move_toward(velocity.x, move_dir.x * target_speed, acceleration * delta)
		velocity.z = move_toward(velocity.z, move_dir.z * target_speed, acceleration * delta)
		
		# Som de passos suaves
		if is_on_floor():
			var step_interval: float = 0.35 if is_sprinting else 0.55
			footstep_timer += delta
			if footstep_timer >= step_interval:
				footstep_timer = 0.0
				AudioManager.play_footstep()
	else:
		velocity.x = move_toward(velocity.x, 0.0, friction * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * delta)
		footstep_timer = 0.0
	
	move_and_slide()

## Gerencia identificação de objetos e gatilho de interação com E
func _update_interaction() -> void:
	if not interaction_ray:
		return
	
	var collider = interaction_ray.get_collider()
	var new_interactable: Interactable = null
	
	if collider:
		if collider is Interactable:
			new_interactable = collider
		elif collider.get_parent() is Interactable:
			new_interactable = collider.get_parent() as Interactable
	
	# Transição de foco
	if new_interactable != current_interactable:
		if current_interactable:
			current_interactable.on_focus_exit()
		current_interactable = new_interactable
		if current_interactable:
			current_interactable.on_focus_enter()
	
	# Disparo de interação com a tecla E
	if current_interactable and not GameState.is_dialogue_active and not GameState.is_menu_open:
		if Input.is_action_just_pressed("interact"):
			current_interactable.interact(self)

func get_current_interactable() -> Interactable:
	return current_interactable
