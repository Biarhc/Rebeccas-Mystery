extends Node

## AudioManager — Gerenciador de áudio, sintetizador de ambiência e efeitos sonoros
## Rebecca's Mystery — Godot 4.x

var music_player: AudioStreamPlayer
var ambient_player: AudioStreamPlayer
var sfx_player: AudioStreamPlayer
var ui_player: AudioStreamPlayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_players()
	_generate_procedural_chimes()

func _setup_players() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.name = "MusicPlayer"
	music_player.bus = "Master"
	add_child(music_player)
	
	ambient_player = AudioStreamPlayer.new()
	ambient_player.name = "AmbientPlayer"
	ambient_player.bus = "Master"
	add_child(ambient_player)
	
	sfx_player = AudioStreamPlayer.new()
	sfx_player.name = "SFXPlayer"
	sfx_player.bus = "Master"
	add_child(sfx_player)
	
	ui_player = AudioStreamPlayer.new()
	ui_player.name = "UIPlayer"
	ui_player.bus = "Master"
	add_child(ui_player)

## Gera buffers de áudio WAV procedurais e elegantes para cliques, sinos e retrocesso temporal
var sample_click: AudioStreamWAV
var sample_clue: AudioStreamWAV
var sample_rewind: AudioStreamWAV
var sample_bell: AudioStreamWAV
var sample_footstep: AudioStreamWAV

func _generate_procedural_chimes() -> void:
	sample_click = _create_sine_tone(600.0, 0.04, 0.3)
	sample_clue = _create_two_tone(523.25, 659.25, 0.45, 0.35) # C5 -> E5 chime
	sample_bell = _create_sine_tone(440.0, 1.2, 0.4, true) # Sino distante
	sample_footstep = _create_noise_click(0.06, 0.15)
	sample_rewind = _create_rewind_tone(1.2, 0.4)

func play_ui_click() -> void:
	if ui_player and sample_click:
		ui_player.stream = sample_click
		ui_player.volume_db = -8.0
		ui_player.pitch_scale = randf_range(0.95, 1.05)
		ui_player.play()

func play_clue_found() -> void:
	if sfx_player and sample_clue:
		sfx_player.stream = sample_clue
		sfx_player.volume_db = -4.0
		sfx_player.pitch_scale = 1.0
		sfx_player.play()

func play_school_bell() -> void:
	if sfx_player and sample_bell:
		sfx_player.stream = sample_bell
		sfx_player.volume_db = -6.0
		sfx_player.play()

func play_time_rewind() -> void:
	if sfx_player and sample_rewind:
		sfx_player.stream = sample_rewind
		sfx_player.volume_db = -2.0
		sfx_player.play()

func play_footstep() -> void:
	if sfx_player and sample_footstep:
		sfx_player.stream = sample_footstep
		sfx_player.volume_db = -16.0
		sfx_player.pitch_scale = randf_range(0.85, 1.15)
		sfx_player.play()

# Síntese em memória de ondas sonoras para garantir áudio sem dependência de MP3 externos
func _create_sine_tone(freq: float, duration: float, volume: float, bell_decay: bool = false) -> AudioStreamWAV:
	var sample_rate: int = 22050
	var total_samples: int = int(sample_rate * duration)
	var byte_array := PackedByteArray()
	byte_array.resize(total_samples * 2) # 16-bit mono
	
	for i in range(total_samples):
		var t: float = float(i) / float(sample_rate)
		var envelope: float = 1.0 - (float(i) / float(total_samples))
		if bell_decay:
			envelope = exp(-t * 3.5)
		else:
			envelope = clampf(envelope * 2.0, 0.0, 1.0) * exp(-t * 4.0)
		
		var sample_val: float = sin(2.0 * PI * freq * t) * envelope * volume
		var int_val: int = int(clampf(sample_val, -1.0, 1.0) * 32767.0)
		byte_array.encode_s16(i * 2, int_val)
	
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = byte_array
	return stream

func _create_two_tone(freq1: float, freq2: float, duration: float, volume: float) -> AudioStreamWAV:
	var sample_rate: int = 22050
	var total_samples: int = int(sample_rate * duration)
	var byte_array := PackedByteArray()
	byte_array.resize(total_samples * 2)
	
	for i in range(total_samples):
		var t: float = float(i) / float(sample_rate)
		var envelope: float = exp(-t * 3.0)
		var f: float = freq1 if t < (duration * 0.4) else freq2
		var sample_val: float = sin(2.0 * PI * f * t) * envelope * volume
		var int_val: int = int(clampf(sample_val, -1.0, 1.0) * 32767.0)
		byte_array.encode_s16(i * 2, int_val)
	
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = byte_array
	return stream

func _create_noise_click(duration: float, volume: float) -> AudioStreamWAV:
	var sample_rate: int = 22050
	var total_samples: int = int(sample_rate * duration)
	var byte_array := PackedByteArray()
	byte_array.resize(total_samples * 2)
	
	for i in range(total_samples):
		var t: float = float(i) / float(total_samples)
		var envelope: float = (1.0 - t) * (1.0 - t)
		var sample_val: float = randf_range(-1.0, 1.0) * envelope * volume
		var int_val: int = int(clampf(sample_val, -1.0, 1.0) * 32767.0)
		byte_array.encode_s16(i * 2, int_val)
	
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = byte_array
	return stream

func _create_rewind_tone(duration: float, volume: float) -> AudioStreamWAV:
	var sample_rate: int = 22050
	var total_samples: int = int(sample_rate * duration)
	var byte_array := PackedByteArray()
	byte_array.resize(total_samples * 2)
	
	for i in range(total_samples):
		var progress: float = float(i) / float(total_samples)
		# Frequência vai subindo de 150Hz até 600Hz imitando retrocesso
		var freq: float = lerp(150.0, 700.0, progress)
		var t: float = float(i) / float(sample_rate)
		var pulse: float = sin(progress * PI * 24.0) * 0.3 + 0.7 # batimento
		var sample_val: float = sin(2.0 * PI * freq * t) * pulse * volume
		var int_val: int = int(clampf(sample_val, -1.0, 1.0) * 32767.0)
		byte_array.encode_s16(i * 2, int_val)
	
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = byte_array
	return stream
