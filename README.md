# Rebecca's Mystery — Godot Engine 4.x

> *“Everyone said girls support girls.”*  
> *Na Academia Saint Claire, por trás de sorrisos impecáveis e do lema institucional de união, escondem-se rivalidades, sussurros cruéis e um silêncio cúmplice. Em um colégio onde todas fingem se apoiar, quem realmente estava presente quando alguém precisou de socorro?*

---

## 1. Visão Geral do Projeto

**Rebecca's Mystery** é um jogo narrativo 3D de mistério psicológico e investigação escolar na **Godot Engine 4.x**, com estética *dark academia*, atmosfera cinematográfica, adolescente e melancólica. 

A protagonista, **Rabecca**, testemunha a trágica morte de sua colega de turma **Clara Martins**. Após o ocorrido, um fenômeno inexplicável a faz retornar no tempo para semanas antes da tragédia. Rabecca passa a navegar pelos corredores e salas de aula, investigando papéis rasgados, fotos antigas e celulares esquecidos, dialogando com as alunas e confrontando mentiras para tentar alterar o destino de Clara.

---

## 2. Tecnologias e Arquitetura

- **Engine:** Godot Engine 4.x (Renderizador *gl_compatibility* para máxima compatibilidade em computadores escolares e estações de trabalho).
- **Linguagem:** GDScript tipado e modular.
- **Ambientes 3D:** Cenas construídas com `CSGBox3D`, `StaticBody3D`, `CollisionShape3D`, malhas PBR estilizadas e iluminação atmosférica suave.
- **Interface e HUD:** Nós `Control`, `CanvasLayer`, `PanelContainer`, temas customizados e efeitos de digitação.
- **Persistência Local:** `SaveManager` nativo em `user://rebeccas_mystery_save.json` com validação de integridade.
- **Áudio Imersivo Sem Dependências:** Síntese procedural interna de sinos, cliques de interface, chimes de descoberta e retrocesso temporal (`AudioStreamWAV` e `AudioManager`).

---

## 3. Identidade Visual e Paleta de Cores

A direção de arte combina *dark academia*, sonho, melancolia e noite chuvosa, respeitando estritamente a paleta:

| Cor | Hex | Aplicação no Jogo |
|---|---|---|
| **Fundo Quase Preto** | `#00030E` | Céu externo, transições e fade de abertura |
| **Fundo Secundário** | `#0B0E1A` | Painéis de UI, diário, pistas e paredes do colégio |
| **Roxo Muito Escuro** | `#2C1B2F` | Parquet encerado do chão e acabamentos de madeira |
| **Roxo Ameixa** | `#5E3A5C` | Uniformes escolares, bordas de janelas e rodapés |
| **Rosa Envelhecido** | `#B47A9A` | Destaques da HUD, metais dourados, citações e nomes |
| **Branco Rosado** | `#F3E9EC` | Textos principais, folhas de papel e luzes de chuva |

---

## 4. Controles (Teclado e Mouse)

| Comando | Tecla / Ação | Descrição |
|---|---|---|
| **Movimentação** | `W`, `A`, `S`, `D` | Movimenta Rabecca com aceleração e desaceleração suaves |
| **Correr** | `Shift` | Acelera o passo pelos corredores |
| **Olhar / Câmera** | `Mouse` | Rotação suave em primeira pessoa (sensibilidade ajustável) |
| **Interagir / Investigar** | `E` | Examina pistas, abre portas e inicia conversas com NPCs |
| **Painel de Pistas** | `Tab` | Abre o arquivo de evidências e notas descobertas |
| **Diário de Rabecca** | `J` | Exibe pensamentos cronológicos e reflexões dos acontecimentos |
| **Lanterna** | `F` | Alterna a lanterna de exploração |
| **Pausa / Menu** | `Esc` | Abre opções, salvar, carregar e configurações |

---

## 5. Como Abrir e Executar o Jogo

### Opção 1: Pela Interface da Godot Engine 4.x
1. Abra o executável da **Godot Engine 4.x** (por exemplo, `Godot_v4.7.2-stable_win64.exe`).
2. No gerenciador de projetos, clique em **Importar** (*Import*).
3. Navegue até esta pasta:
   ```
   z:\Lab. Informática\PC 03\Documentos\Beatriz DW\Rebecca´s Mystery
   ```
4. Selecione o arquivo `project.godot` e clique em **Importar e Editar** (*Import & Edit*).
5. Pressione **F5** (ou o botão de Play no canto superior direito) para rodar o jogo completo. A cena principal configurada é `res://scenes/menus/main_menu.tscn`.

### Opção 2: Linha de Comando (Direto)
No PowerShell ou Prompt de Comando nesta pasta:
```powershell
& "Z:\DW\jogo\Godot_v4.7.2-stable_win64.exe" --path .
```

---

## 6. Estrutura de Pastas e Arquivos

```
Rebecca's Mystery/
├── project.godot                     # Configuração global, Autoloads e Input Maps
├── README.md                         # Documentação completa
├── icon.svg                          # Ícone temático da Academia Saint Claire
├── data/
│   ├── characters.json               # Perfis completos das 7 personagens principais
│   ├── clues.json                    # Banco de dados de pistas e locais de descoberta
│   ├── dialogues.json                # Diálogos ramificados, escolhas e consequências
│   └── events.json                   # Linhas do tempo A, B, C e marcos de calendário
├── scenes/
│   ├── menus/
│   │   ├── main_menu.tscn            # Menu 3D com câmera em rotação lenta e chuva
│   │   ├── pause_menu.tscn           # Menu de pausa (salvar, carregar, configurações)
│   │   ├── settings_menu.tscn        # Controle de sensibilidade, volume e tela cheia
│   │   └── credits_menu.tscn         # Créditos e avisos de assets
│   ├── cutscenes/
│   │   ├── introduction.tscn         # Introdução narrativa com texto e fade cinematográfico
│   │   └── time_rewind.tscn          # Retorno no tempo com ponteiros de relógio reversos
│   ├── levels/
│   │   ├── main_corridor.tscn        # Corredor 3D com armários, janelas, NPCs e pistas
│   │   ├── classroom.tscn            # Sala de aula 2-B com carteira de Clara e lousa
│   │   └── other_areas_template.tscn # Template modular para expansão da escola
│   ├── characters/
│   │   ├── rabecca.tscn              # Protagonista jogável em primeira pessoa
│   │   └── npc_template.tscn         # Template 3D de NPCs com identificação e diálogo
│   ├── interactables/
│   │   ├── clue_object.tscn          # Objetos físicos 3D inspecionáveis com E
│   │   └── door.tscn                 # Portas interativas funcionais entre salas
│   └── ui/
│       ├── hud.tscn                  # HUD discreta com relógio, mira e notificações
│       ├── dialogue_box.tscn         # Caixa de diálogo com máquina de escrever e escolhas
│       ├── clues_panel.tscn          # Arquivo de evidências com divisão em duas colunas
│       └── diary_panel.tscn          # Diário pessoal cronológico de Rabecca
├── scripts/
│   ├── autoload/
│   │   ├── game_state.gd             # Estado global, pistas, tempo e relacionamentos
│   │   ├── save_manager.gd           # Persistência em user://rebeccas_mystery_save.json
│   │   └── audio_manager.gd          # Ambiência, chimes e passos sem dependências
│   ├── systems/
│   │   ├── dialogue_manager.gd       # Lógica de diálogos condicionais e escolhas
│   │   └── timeline_manager.gd       # Gerenciamento de linhas temporais e viagens
│   ├── player/
│   │   └── player_controller.gd      # Movimentação física 3D, lanterna e RayCast
│   ├── interactables/
│   │   ├── interactable.gd           # Classe base para interações 3D
│   │   ├── clue_object.gd            # Registro de pistas físicas
│   │   └── door.gd                   # Transição funcional entre salas
│   ├── characters/
│   │   └── npc.gd                    # Reações e gatilhos de diálogo com NPCs
│   └── ui/
│       ├── main_menu.gd
│       ├── pause_menu.gd
│       ├── settings_menu.gd
│       ├── credits_menu.gd
│       ├── introduction.gd
│       ├── time_rewind.gd
│       ├── hud.gd
│       ├── dialogue_box.gd
│       ├── clues_panel.gd
│       └── diary_panel.gd
├── assets/
│   ├── materials/                    # Materiais PBR estilizados (madeira, pedra, vidro, metal)
│   └── themes/                       # Tema de interface da Academia Saint Claire
└── tests/
    ├── test_game_systems.gd          # Suíte de verificação automatizada dos sistemas
    └── test_runner.tscn              # Cena executável de teste unitário e de integração
```

---

## 7. Personagens da História

1. **Rabecca (Protagonista):** Observadora e inteligente. Carrega o peso de ter visto a tragédia e o mistério de ter voltado no tempo.
2. **Clara Martins (A Garota Central):** Sensível, artista talentosa e reservada. Foi sufocada por rumores e pela indiferença coletiva.
3. **Sophia Leal (Melhor Amiga):** Dedicada e ansiosa. Sente uma culpa corrosiva por ter se afastado de Clara antes do fim.
4. **Beatriz Ramos (Líder Estudantil):** Comunicativa e carismática. Defensiva quando confrontada sobre o que aconteceu no passado.
5. **Valentina Rocha (Rival Acadêmica):** Hostil e perfeccionista sob forte pressão familiar. No fundo, sente falta da amizade que teve com Clara na infância.
6. **Helena Prado (A Observadora):** Solitária e misteriosa. Sabe dos segredos dos corredores e guarda evidências arquivadas.
7. **Profª. Elizabeth Mendes (Literatura e Orientação):** Educada e bem-intencionada, porém cega às crueldades psicológicas sutis do colégio.

---

## 8. Linhas do Tempo e Consequências

- **Linha do Tempo A (O Silêncio Permanece):** Poucas pistas são reunidas ou as personagens são acusadas de forma agressiva, mantendo as barreiras de silêncio.
- **Linha do Tempo B (Conflitos Expostos):** As mentiras vêm à tona, mas a falta de acolhimento gera novas brigas públicas.
- **Linha do Tempo C (Acolhimento e Verdade):** Com empatia, descoberta do bilhete rasgado e da foto antiga, Rabecca desarma as defesas de Valentina e Sophia, unindo apoio genuíno antes do colapso.

---

## 9. Status dos Assets e Placeholders

- **Sistemas de Código e Lógica:** 100% implementados, tipados e verificados pelo motor Godot.
- **Ambientes 3D:** Estrutura completa de arquitetura estilizada (corredor e sala de aula) utilizando CSG e materiais PBR na paleta oficial.
- **Personagens 3D:** Modelos em silhuetas estilizadas representativas com blazer, saia, detalhes em latão e nametags 3D (placeholders funcionais prontos para receber modelos com malhas esqueléticas e animações faciais).
- **Áudio:** Síntese procedural de alta performance em memória para chimes de pistas, retrocesso temporal, passos e sinos (pronto para receber trilhas orquestrais WAV/OGG quando disponíveis).
