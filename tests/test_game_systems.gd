extends Node

## Automated Verification Test for Rebecca's Mystery
## Tests JSON data, GameState, SaveManager, Dialogue conditions, and Scene Loading

func _ready() -> void:
	print("==================================================")
	print("--- REBECCA'S MYSTERY: INICIANDO TESTES DO SISTEMA ---")
	print("==================================================")
	
	var all_passed: bool = true
	
	# Teste 1: Dados JSON
	print("[TESTE 1] Verificando carregamento de arquivos JSON...")
	if GameState.all_characters_data.is_empty():
		print("❌ FALHA: characters.json vazio ou não carregado!")
		all_passed = false
	else:
		print("✔ characters.json carregado com %d personagens: %s" % [
			GameState.all_characters_data.size(),
			", ".join(GameState.all_characters_data.keys())
		])
	
	if GameState.all_clues_data.is_empty():
		print("❌ FALHA: clues.json vazio ou não carregado!")
		all_passed = false
	else:
		print("✔ clues.json carregado com %d pistas." % GameState.all_clues_data.size())
	
	if GameState.all_dialogues_data.is_empty():
		print("❌ FALHA: dialogues.json vazio ou não carregado!")
		all_passed = false
	else:
		print("✔ dialogues.json carregado com %d nós de conversa." % GameState.all_dialogues_data.size())
	
	# Teste 2: Novo Jogo e Diário
	print("\n[TESTE 2] Testando novo jogo e sistema de tempo...")
	GameState.start_new_game()
	if GameState.current_time != "14:30" or GameState.diary_entries.size() == 0:
		print("❌ FALHA ao inicializar novo jogo!")
		all_passed = false
	else:
		print("✔ Novo jogo inicializado: Horário=%s, Diário tem %d entrada." % [
			GameState.current_time, GameState.diary_entries.size()
		])
	
	# Teste 3: Avanço de tempo
	GameState.advance_time(15)
	if GameState.current_time != "14:45":
		print("❌ FALHA: Avanço de tempo incorreto (%s esperado: 14:45)" % GameState.current_time)
		all_passed = false
	else:
		print("✔ Avanço de tempo verificado: 14:30 + 15m = %s" % GameState.current_time)
	
	# Teste 4: Descoberta de pistas
	print("\n[TESTE 3] Testando investigação e pistas...")
	var disc_res := GameState.discover_clue("clue_torn_note")
	if not disc_res or not GameState.is_clue_discovered("clue_torn_note"):
		print("❌ FALHA: Não registrou descoberta de clue_torn_note!")
		all_passed = false
	else:
		print("✔ Pista registrada com sucesso. Total de pistas: %d" % GameState.discovered_clues.size())
	
	# Teste 5: Diálogo e Condições
	print("\n[TESTE 4] Testando DialogueManager e condições de ramificação...")
	DialogueManager.start_dialogue("sophia_intro")
	if not DialogueManager.is_active:
		print("❌ FALHA: DialogueManager não ativou sophia_intro!")
		all_passed = false
	else:
		print("✔ Diálogo ativado: %s falando: %s" % [
			DialogueManager.current_dialogue_data.get("speaker", ""),
			DialogueManager.current_dialogue_data.get("text", "")
		])
	
	# Teste 6: Escolha e Alteração de Relacionamento
	print("\n[TESTE 5] Testando escolhas e impacto nos relacionamentos...")
	var initial_trust: int = GameState.relationships.get("sophia", {}).get("trust", 50)
	var option_test := {
		"id": "sophia_ask_concerned",
		"text": "Estou perguntando porque estou preocupada.",
		"relationship_effects": { "sophia": { "trust": 15, "friendship": 10 } },
		"feedback_message": "Sophia sentiu sinceridade em suas palavras."
	}
	DialogueManager.select_option(option_test)
	var new_trust: int = GameState.relationships.get("sophia", {}).get("trust", 50)
	if new_trust != initial_trust + 15:
		print("❌ FALHA: Confiança de Sophia não foi alterada (era %d, agora é %d)" % [initial_trust, new_trust])
		all_passed = false
	else:
		print("✔ Escolha registrada! Confiança de Sophia subiu de %d para %d." % [initial_trust, new_trust])
	
	# Teste 7: Save & Load
	print("\n[TESTE 6] Testando SaveManager local...")
	var test_pos := Vector3(1.5, 0.0, 3.2)
	var save_ok := SaveManager.save_game(test_pos)
	if not save_ok or not SaveManager.has_save_file():
		print("❌ FALHA ao salvar o jogo!")
		all_passed = false
	else:
		print("✔ Jogo salvo com sucesso em user://rebeccas_mystery_save.json")
	
	# Teste 8: Carregamento de Cenas
	print("\n[TESTE 7] Verificando integridade das cenas 3D e de interface...")
	var scenes_to_test := [
		"res://scenes/menus/main_menu.tscn",
		"res://scenes/cutscenes/introduction.tscn",
		"res://scenes/cutscenes/time_rewind.tscn",
		"res://scenes/levels/main_corridor.tscn",
		"res://scenes/levels/classroom.tscn",
		"res://scenes/levels/other_areas_template.tscn",
		"res://scenes/characters/rabecca.tscn",
		"res://scenes/ui/hud.tscn"
	]
	
	for sc_path in scenes_to_test:
		var scene_res = ResourceLoader.load(sc_path)
		if scene_res == null:
			print("❌ FALHA ao carregar cena: " + sc_path)
			all_passed = false
		else:
			print("✔ Cena válida: " + sc_path)
	
	print("\n==================================================")
	if all_passed:
		print("🎉 TODOS OS TESTES PASSARAM COM SUCESSO! PROJETO ÍNTEGRO.")
	else:
		print("⚠ ALGUNS TESTES FALHARAM. VERIFIQUE OS LOGS ACIMA.")
	print("==================================================")
	
	get_tree().quit()
