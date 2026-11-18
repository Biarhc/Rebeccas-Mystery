/**
 * Rebecca's Mystery — Sistema Integrado de Missões Progressivas e Diálogos Desbloqueados
 * Gerencia o desbloqueio progressivo de missões (ocultando estritamente as futuras),
 * controle de objetivos obrigatórios, desbloqueio sequencial de diálogos por missão e persistência.
 */

class MissionManager {
  constructor(game) {
    this.game = game;
    this.confrontationMode = false;
    this.container = null;

    // Definições de todos os comandos possíveis com atalhos, ícones e ações
    this.ACTIONS = {
      move: {
        id: "move",
        label: "Movimentar",
        hotkey: "M",
        keyCode: "KeyM",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <ellipse cx="7" cy="14" rx="2.5" ry="4" transform="rotate(-15 7 14)"/>
            <circle cx="7" cy="7" r="1.5"/>
            <ellipse cx="17" cy="9" rx="2.5" ry="4" transform="rotate(15 17 9)"/>
            <circle cx="17" cy="2" r="1.5"/>
          </svg>
        `,
        description: "Mover Rebecca entre os cômodos da Saint Claire",
        execute: () => this.handleMoveAction()
      },
      interact: {
        id: "interact",
        label: "Interagir",
        hotkey: "E",
        keyCode: "KeyE",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        `,
        description: "Interagir com personagens ou objetos da etapa atual",
        execute: () => this.handleInteractAction()
      },
      examine: {
        id: "examine",
        label: "Examinar",
        hotkey: "X",
        keyCode: "KeyX",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        `,
        description: "Examinar detalhes e pistas da missão atual",
        execute: () => this.handleExamineAction()
      },
      take: {
        id: "take",
        label: "Pegar Objeto",
        hotkey: "P",
        keyCode: "KeyP",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        `,
        description: "Recolher materiais necessários para a missão",
        execute: () => this.handleTakeAction()
      },
      deliver: {
        id: "deliver",
        label: "Entregar",
        hotkey: "D",
        keyCode: "KeyD",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
        `,
        description: "Entregar materiais ao destinatário correto",
        execute: () => this.handleDeliverAction()
      },
      observe: {
        id: "observe",
        label: "Observar",
        hotkey: "V",
        keyCode: "KeyV",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `,
        description: "Observar discretamente a dinâmica e postura das alunas",
        execute: () => this.handleObserveAction()
      },
      dialogue: {
        id: "dialogue",
        label: "Dialogar",
        hotkey: "C",
        keyCode: "KeyC",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        `,
        description: "Iniciar conversa com os personagens da etapa atual",
        execute: () => this.handleDialogueAction()
      },
      support: {
        id: "support",
        label: "Apoiar Melissa",
        hotkey: "A",
        keyCode: "KeyA",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        `,
        description: "Dar acolhimento e apoio seguro para Melissa",
        execute: () => this.handleSupportAction()
      },
      report: {
        id: "report",
        label: "Relatar Orientação",
        hotkey: "R",
        keyCode: "KeyR",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        `,
        description: "Relatar os fatos de forma segura à Professora Professora",
        execute: () => this.handleReportAction()
      },
      objective: {
        id: "objective",
        label: "Objetivo",
        hotkey: "O",
        keyCode: "KeyO",
        icon: `
          <svg class="action-btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        `,
        description: "Consultar histórico de missões e objetivos atuais",
        execute: () => this.handleObjectiveAction()
      }
    };

    // Configuração oficial progressiva das 8 Missões com objetivos e diálogos sequenciais
    this.MISSIONS_CONFIG = {
      1: {
        id: 1,
        objective: "Entregar a pasta de relatórios na mesa da Professora na Sala de Literatura.",
        title: "Missão 1 — Um novo dia na Saint Claire",
        shortTitle: "1. Um novo dia",
        description: "Rebecca inicia o dia na Saint Claire. Ela precisa se orientar e entregar os relatórios curriculares da turma 2-B para a professora Paola.",
        actions: ["move", "interact", "objective"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "ENTREGAR"],
        targetScene: "literature_room",
        objectives: [
          { id: "m1_obj_1", description: "Ir até a Sala de Literatura na biblioteca", targetScene: "literature_room" },
          { id: "m1_obj_2", description: "Entregar a pasta de relatórios à Professora", requiredDialogue: "m1_paola_delivery" }
        ],
        availableDialogues: [
          "m1_sam_intro", "m1_sam_classroom", "m1_sam_classroom_detail", "m1_sam_classroom_ironic",
          "m1_melissa_hallway", "m1_sophia_library",
          "m1_paola_delivery", "m1_paola_talk", "m1_paola_melissa"
        ],
        requiredDialogues: ["m1_paola_delivery"],
        characterMapping: {
          classroom: {
            clara: "m1_sam_intro",
            sam: "m1_sam_classroom"
          },
          hallway: {
            melissa: "m1_melissa_hallway"
          },
          literature_room: {
            paola: "m1_paola_delivery",
            professora: "m1_paola_delivery",
            sophia: "m1_sophia_library"
          }
        },
        nextMissionId: 2
      },
      2: {
        id: 2,
        objective: "Procurar o caderno de literatura azul na mesa central da Sala de Literatura.",
        title: "Missão 2 — O material perdido",
        shortTitle: "2. O caderno azul",
        description: "Sophia perdeu seu caderno de literatura azul com anotações importantes para o seminário. Rebecca precisa procurá-lo na mesa central da biblioteca e entregá-lo para Sophia.",
        actions: ["move", "interact", "examine", "objective"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "INVESTIGAR"],
        targetScene: "literature_room",
        objectives: [
          { id: "m2_obj_1", description: "Procurar o caderno de literatura azul na mesa central da Sala de Literatura", requiredClue: "blue_literature_notebook" },
          { id: "m2_obj_2", description: "Entregar o caderno de literatura azul para Sophia", requiredDialogue: "m2_valery_deliver" }
        ],
        availableDialogues: [
          "m2_clara_classroom", "m2_sam_hallway",
          "m2_valery_library", "m2_valery_deliver",
          "m2_melissa_scattered", "m2_melissa_evasion", "m2_melissa_defensive"
        ],
        requiredDialogues: ["m2_valery_deliver"],
        characterMapping: {
          classroom: {
            clara: "m2_clara_classroom"
          },
          hallway: {
            sam: "m2_sam_hallway"
          },
          literature_room: {
            sophia: "m2_valery_library",
            valery: "m2_valery_library",
            melissa: "m2_melissa_scattered"
          }
        },
        nextMissionId: 3
      },
      3: {
        id: 3,
        objective: "Recolher as tintas especiais no Ateliê de Artes com Sophia e levar para o Conselho Estudantil.",
        title: "Missão 3 — Preparativos para o evento escolar",
        shortTitle: "3. Preparativos do evento",
        description: "Rebecca ajuda na organização do festival escolar, descobre que Melissa foi excluída das comissões e busca as tintas no Ateliê de Artes para levar ao Conselho.",
        actions: ["move", "interact", "take", "deliver", "objective"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "PEGAR", "COLETAR", "ENTREGAR"],
        targetScene: "student_council",
        pickupScene: "art_room",
        objectives: [
          { id: "m3_obj_1", description: "Conversar com Sophia no Ateliê de Artes e recolher as tintas", requiredDialogue: "m3_chloe_art", requiredItem: "hasTakenPaints" },
          { id: "m3_obj_2", description: "Levar e entregar os materiais para Clara no Conselho Estudantil", requiredDialogue: "m3_madison_council" }
        ],
        availableDialogues: [
          "m3_chloe_art", "m3_chloe_whisper", "m3_chloe_carry",
          "m3_madison_council", "m3_madison_freeze", "m3_sam_hallway"
        ],
        requiredDialogues: ["m3_chloe_art", "m3_madison_council"],
        characterMapping: {
          art_room: {
            sophia: "m3_chloe_art",
            chloe: "m3_chloe_art"
          },
          student_council: {
            clara: "m3_madison_council",
            madison: "m3_madison_council"
          },
          hallway: {
            sam: "m3_sam_hallway"
          }
        },
        nextMissionId: 4
      },
      4: {
        id: 4,
        objective: "Entregar o comunicado do conselho para a delegada de turma Clara no Corredor Principal.",
        title: "Missão 4 — Um recado inesperado",
        shortTitle: "4. Um recado inesperado",
        description: "Perto dos armários do corredor, Rebecca encontra um bilhete humilhante anônimo e deve levar o comunicado escolar para Clara.",
        actions: ["move", "interact", "examine", "deliver", "objective"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "INVESTIGAR", "ENTREGAR"],
        targetScene: "hallway",
        objectives: [
          { id: "m4_obj_1", description: "Examinar o bilhete amassado nos armários do Corredor", requiredClue: "torn_note" },
          { id: "m4_obj_2", description: "Entregar o comunicado do conselho para Clara", requiredDialogue: "m4_deliver_sam" }
        ],
        availableDialogues: [
          "m4_paper_clue", "m4_melissa_approaches", "m4_melissa_nervous",
          "m4_melissa_plea", "m4_deliver_sam", "m4_sam_hallway", "m4_sam_hallway_clue", "m4_sam_hallway_support"
        ],
        requiredDialogues: ["m4_deliver_sam"],
        characterMapping: {
          hallway: {
            clara: "m4_deliver_sam",
            sam: "m4_sam_hallway",
            melissa: "m4_melissa_approaches"
          }
        },
        nextMissionId: 5
      },
      5: {
        id: 5,
        objective: "Ir ao Laboratório de Ciências e verificar a divisão de duplas para a atividade prática.",
        title: "Missão 5 — Trabalhos em grupo",
        shortTitle: "5. Trabalhos em grupo",
        description: "No Laboratório de Ciências, Rebecca testemunha como as atitudes de Clara e Sophia forçam Melissa a se isolar da turma.",
        actions: ["move", "interact", "observe", "dialogue", "objective"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "DIALOGAR"],
        targetScene: "science_lab",
        objectives: [
          { id: "m5_obj_1", description: "Ir ao Laboratório de Ciências e observar a formação de duplas", targetScene: "science_lab" },
          { id: "m5_obj_2", description: "Presenciar e intervir nas discussões com Clara e Melissa", requiredDialogue: "m5_lab_conflict" }
        ],
        availableDialogues: [
          "m5_science_intro", "m5_lab_conflict", "m5_chloe_mock", "m5_melissa_gives_up", "m5_sam_hallway"
        ],
        requiredDialogues: ["m5_lab_conflict"],
        characterMapping: {
          science_lab: {
            clara: "m5_lab_conflict",
            madison: "m5_lab_conflict",
            sophia: "__passive__",
            chloe: "__passive__",
            melissa: "__passive__"
          },
          hallway: {
            sam: "m5_sam_hallway"
          }
        },
        nextMissionId: 6
      },
      6: {
        id: 6,
        objective: "Pegar o livro de partituras e estudos na Sala de Estudos e falar com Melissa.",
        title: "Missão 6 — Pequenos sinais",
        shortTitle: "6. Pequenos sinais",
        description: "Na Sala de Estudos Silenciosa, Rebecca encontra Melissa fragilizada e tenta criar um espaço de conversa segura.",
        actions: ["move", "interact", "examine", "dialogue", "objective"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "INVESTIGAR", "DIALOGAR"],
        targetScene: "study_room",
        objectives: [
          { id: "m6_obj_1", description: "Localizar Melissa no canto silencioso da Sala de Estudos", targetScene: "study_room" },
          { id: "m6_obj_2", description: "Conversar com Melissa e demonstrar apoio sem pressioná-la", requiredDialogue: "m6_study_melissa" }
        ],
        availableDialogues: [
          "m6_study_melissa", "m6_melissa_hesitation", "m6_melissa_fear", "m6_sam_study"
        ],
        requiredDialogues: ["m6_study_melissa"],
        characterMapping: {
          study_room: { melissa: "m6_study_melissa" },
          hallway: { sam: "m6_sam_study" }
        },
        nextMissionId: 7
      },
      7: {
        id: 7,
        objective: "Levar a pasta de atividades para Melissa perto da Escadaria Central.",
        title: "Missão 7 — O que Rebecca finalmente vê",
        shortTitle: "7. O que Rebecca vê",
        description: "Ponto de virada decisivo: perto da escadaria central, Rebecca presencia o bullying verbal e intimidador de Clara e Sophia, intervém com firmeza e acolhe o desabafo de Melissa.",
        actions: ["move", "interact", "observe", "dialogue", "objective"],
        confrontationActions: ["observe", "interact", "dialogue", "support"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "DIALOGAR"],
        targetScene: "staircase",
        objectives: [
          { id: "m7_obj_1", description: "Ir até o mezanino da Escadaria Central", targetScene: "staircase" },
          { id: "m7_obj_2", description: "Confrontar o bullying de Clara e Sophia e acolher Melissa", requiredDialogue: "m7_confrontation_trigger" }
        ],
        availableDialogues: [
          "m7_corridor_walk", "m7_confrontation_trigger", "m7_chloe_laugh",
          "m7_rebecca_intervenes", "m7_madison_excuse", "m7_chloe_excuse",
          "m7_bullies_retreat", "m7_melissa_relief", "m7_melissa_confession_1",
          "m7_melissa_confession_2", "m7_melissa_confession_3", "m7_melissa_comfort",
          "m7_sam_hallway"
        ],
        requiredDialogues: ["m7_confrontation_trigger"],
        characterMapping: {
          staircase: {
            clara: "m7_confrontation_trigger",
            madison: "m7_confrontation_trigger",
            sophia: "__passive__",
            chloe: "__passive__",
            melissa: "__passive__"
          },
          hallway: {
            sam: "m7_sam_hallway"
          }
        },
        nextMissionId: 8
      },
      8: {
        id: 8,
        objective: "Acompanhar Melissa até a sala da Professora para relatar a situação.",
        title: "Missão 8 — Você não precisa enfrentar isso sozinha",
        shortTitle: "8. Não enfrente sozinha",
        description: "Rebecca caminha ao lado de Melissa até a sala de orientação da Professora para relatar todos os acontecimentos com segurança e acolhimento.",
        actions: ["move", "interact", "support", "report", "objective"],
        allowedHotspotActions: ["EXAMINAR", "OBSERVAR", "APOIAR", "RELATAR"],
        targetScene: "student_council",
        objectives: [
          { id: "m8_obj_1", description: "Acompanhar Melissa até a sala de orientação", targetScene: "student_council" },
          { id: "m8_obj_2", description: "Relatar a situação com segurança para a Professora", requiredDialogue: "m8_paola_report" }
        ],
        availableDialogues: [
          "m8_start_talk", "m8_melissa_ready", "m8_paola_report",
          "m8_paola_decision", "m8_ending_corridor", "m8_sam_hallway"
        ],
        requiredDialogues: ["m8_paola_report"],
        characterMapping: {
          staircase: { melissa: "m8_start_talk" },
          student_council: {
            paola: "m8_paola_report",
            professora: "m8_paola_report"
          },
          hallway: {
            sam: "m8_sam_hallway"
          }
        },
        nextMissionId: null
      }
    };
  }

  init() {
    this.createActionBarDOM();
    this.bindKeyboardShortcuts();
    this.ensureProgressState();
    this.updateMissionUI();
  }

  /* Garante que o estado tenha arrays de controle progressivo */
  ensureProgressState() {
    if (!this.game.state) return;
    if (!this.game.state.completedObjectives) this.game.state.completedObjectives = [];
    if (!this.game.state.completedDialogues) this.game.state.completedDialogues = [];
    if (!this.game.state.completedMissions) this.game.state.completedMissions = [];
    if (!this.game.state.currentMission) this.game.state.currentMission = 1;
  }

  /* Cria o contêiner e o dock de botões dinâmicos no HUD */
  createActionBarDOM() {
    let barContainer = document.getElementById("mission-action-dock");
    if (!barContainer) {
      const footer = document.querySelector(".hud-footer");
      barContainer = document.createElement("div");
      barContainer.id = "mission-action-dock";
      barContainer.className = "mission-action-dock";

      if (footer) {
        footer.insertBefore(barContainer, footer.querySelector(".hud-actions"));
      } else {
        document.getElementById("gameplay-screen")?.appendChild(barContainer);
      }
    }
    this.container = barContainer;
  }

  /* Retorna a configuração da missão ativa atual */
  getCurrentMissionConfig() {
    const missionId = this.game.state?.currentMission || 1;
    return this.MISSIONS_CONFIG[missionId] || this.MISSIONS_CONFIG[1];
  }

  /* Retorna o diálogo correto de um personagem de acordo com a missão atual */
  getDialogueForCharacter(charId, defaultDialogueId = null) {
    const currentMission = this.getCurrentMissionConfig();
    const currentScene = this.game.state?.currentScene;

    const aliasMap = {
      clara: ["clara", "madison"],
      sam: ["sam"],
      sophia: ["sophia", "chloe", "valery"],
      professora: ["professora", "paola"],
      melissa: ["melissa"],
      rebecca: ["rebecca"]
    };

    const keysToTry = aliasMap[charId] || [charId];

    if (currentMission.characterMapping && currentMission.characterMapping[currentScene]) {
      for (const k of keysToTry) {
        const dialogueKey = currentMission.characterMapping[currentScene][k];
        if (dialogueKey === "__passive__") {
          return "__passive__";
        }
        if (dialogueKey && this.isDialogueAllowed(dialogueKey)) {
          return dialogueKey;
        }
      }
    }

    return null;
  }

  /* Verifica se um diálogo é permitido na missão atual */
  isDialogueAllowed(dialogueKey) {
    const currentMission = this.getCurrentMissionConfig();
    if (!currentMission.availableDialogues) return true;
    return currentMission.availableDialogues.includes(dialogueKey);
  }

  /* Registra a conclusão de um objetivo */
  completeObjective(objectiveId) {
    this.ensureProgressState();
    if (!this.game.state.completedObjectives.includes(objectiveId)) {
      this.game.state.completedObjectives.push(objectiveId);
      this.game.saveSystem.saveToServer(this.game.state);
      this.updateMissionUI();
      this.checkMissionCompletion();
    }
  }

  /* Registra a realização de um diálogo */
  completeDialogue(dialogueKey) {
    this.ensureProgressState();
    if (!this.game.state.completedDialogues.includes(dialogueKey)) {
      this.game.state.completedDialogues.push(dialogueKey);
      this.game.saveSystem.saveToServer(this.game.state);
    }

    // Verifica se algum objetivo da missão depende desse diálogo
    const currentMission = this.getCurrentMissionConfig();
    (currentMission.objectives || []).forEach(obj => {
      if (obj.requiredDialogue === dialogueKey) {
        this.completeObjective(obj.id);
      }
    });

    this.checkMissionCompletion();
  }

  /* Verifica se todos os objetivos e diálogos obrigatórios da missão atual foram cumpridos */
  checkMissionCompletion() {
    this.ensureProgressState();
    const currentMission = this.getCurrentMissionConfig();
    const currentId = currentMission.id;

    // 1. Checa objetivos
    const allObjectivesDone = (currentMission.objectives || []).every(obj => {
      if (obj.targetScene && this.game.state.currentScene === obj.targetScene) {
        if (!this.game.state.completedObjectives.includes(obj.id)) {
          this.game.state.completedObjectives.push(obj.id);
        }
      }
      if (obj.requiredClue && this.game.state.discoveredClues?.includes(obj.requiredClue)) {
        if (!this.game.state.completedObjectives.includes(obj.id)) {
          this.game.state.completedObjectives.push(obj.id);
        }
      }
      if (obj.requiredItem && this.game.state[obj.requiredItem]) {
        if (!this.game.state.completedObjectives.includes(obj.id)) {
          this.game.state.completedObjectives.push(obj.id);
        }
      }
      return this.game.state.completedObjectives.includes(obj.id);
    });

    // 2. Checa diálogos obrigatórios
    const allDialoguesDone = (currentMission.requiredDialogues || []).every(dKey => {
      return this.game.state.completedDialogues.includes(dKey);
    });

    if (allObjectivesDone && allDialoguesDone) {
      // Avança a missão se não tiver sido avançada ainda
      if (!this.game.state.completedMissions.includes(currentId)) {
        this.completeMission(currentId);
      }
    }
  }

  /* Finaliza formalmente a missão atual e desbloqueia a próxima */
  completeMission(missionId) {
    this.ensureProgressState();
    if (!this.game.state.completedMissions.includes(missionId)) {
      this.game.state.completedMissions.push(missionId);
    }

    const currentConfig = this.MISSIONS_CONFIG[missionId];
    const nextMissionId = currentConfig ? currentConfig.nextMissionId : null;
    const nextConfig = nextMissionId ? this.MISSIONS_CONFIG[nextMissionId] : null;

    if (nextMissionId) {
      this.game.state.currentMission = nextMissionId;
    }

    // Salva o estado completo
    this.game.saveSystem.saveToServer(this.game.state);

    // Dispara animação comemorativa e atualiza a interface
    this.onMissionCompleted(currentConfig, nextConfig);
    this.updateMissionUI();
    this.game.updateHUD();
  }

  /* Atualiza visualmente todos os botões e o banner de objetivo */
  updateMissionUI() {
    if (!this.container) return;

    this.ensureProgressState();
    const mission = this.getCurrentMissionConfig();
    const actionsToShow = this.confrontationMode
      ? (mission.confrontationActions || ["observe", "interact", "dialogue", "support"])
      : mission.actions;

    // Atualiza o banner discreto de objetivo no topo
    this.updateObjectiveBanner(mission);

    // Renderiza os botões dinâmicos com animação suave
    this.renderButtons(actionsToShow);

    // Atualiza a aba de missões do diário (ocultando estritamente as futuras)
    this.renderProgressiveMissionsTab();
  }

  /* Renderiza os botões permitidos na barra de ações */
  renderButtons(actionKeys) {
    if (!this.container) return;

    this.container.classList.add("dock-animating");

    setTimeout(() => {
      this.container.innerHTML = "";

      actionKeys.forEach((key, index) => {
        const actionDef = this.ACTIONS[key];
        if (!actionDef) return;

        const btn = document.createElement("button");
        btn.className = `dynamic-action-btn action-${key}`;
        btn.setAttribute("data-action", key);
        btn.setAttribute("title", `${actionDef.description} (Tecla: ${actionDef.hotkey})`);
        btn.style.animationDelay = `${index * 50}ms`;

        btn.innerHTML = `
          <div class="action-btn-glow"></div>
          <span class="action-key-cap">${actionDef.hotkey}</span>
          <span class="action-icon-wrap">${actionDef.icon}</span>
          <span class="action-label">${actionDef.label}</span>
        `;

        btn.addEventListener("click", () => {
          this.triggerAction(key, btn);
        });

        this.container.appendChild(btn);
      });

      this.container.classList.remove("dock-animating");
    }, 120);
  }

  /* Dispara uma ação (via mouse ou teclado) com feedback visual e sonoro */
  triggerAction(actionKey, buttonEl = null) {
    const actionDef = this.ACTIONS[actionKey];
    if (!actionDef) return;

    const el = buttonEl || this.container?.querySelector(`[data-action="${actionKey}"]`);
    if (el) {
      el.classList.add("active-pulse");
      setTimeout(() => el.classList.remove("active-pulse"), 260);
    }

    if (this.game.audio) {
      this.game.audio.playChoiceSound();
    }

    actionDef.execute();
  }

  /* Mapeamento de teclas de atalho dinâmicas */
  bindKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const gameplayActive = document.getElementById("gameplay-screen")?.classList.contains("active");
      if (!gameplayActive) return;

      const mission = this.getCurrentMissionConfig();
      const allowedActions = this.confrontationMode
        ? (mission.confrontationActions || mission.actions)
        : mission.actions;

      // Atalhos para escolhas de diálogo com números 1, 2, 3, 4
      if (document.getElementById("dialogue-layer")?.classList.contains("active")) {
        if (["1", "2", "3", "4"].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          const choiceBtns = document.querySelectorAll("#dialogue-choices .choice-card-btn");
          if (choiceBtns[index]) {
            e.preventDefault();
            choiceBtns[index].click();
            return;
          }
        }
      }

      for (const key of allowedActions) {
        const actionDef = this.ACTIONS[key];
        if (actionDef && actionDef.hotkey.toLowerCase() === e.key.toLowerCase()) {
          e.preventDefault();
          this.triggerAction(key);
          return;
        }
      }
    });
  }

  /* ========================================================
     AÇÕES ESPECÍFICAS
     ======================================================== */

  handleMoveAction() {
    const exits = document.querySelectorAll(".scene-exit-node");
    if (exits.length === 0) {
      this.game.showConsequenceToast("Não há portas ou saídas diretas neste cômodo.");
      return;
    }

    exits.forEach(exit => {
      exit.classList.add("highlight-door-pulse");
      setTimeout(() => exit.classList.remove("highlight-door-pulse"), 1600);
    });

    const mission = this.getCurrentMissionConfig();
    if (this.game.state?.currentScene === mission.targetScene) {
      this.game.showConsequenceToast(`Você já está no local do objetivo: ${this.game.getCurrentSceneName()}.`);
    } else {
      this.game.showConsequenceToast(`Caminhe em direção a: ${mission.targetScene ? mission.targetScene.replace('_', ' ') : 'próxima sala'}.`);
    }
  }

  handleInteractAction() {
    const env = this.game.data.events?.environments[this.game.state?.currentScene];
    if (!env) return;

    // Prioridade 1: Personagens na sala
    if (env.characters && env.characters.length > 0) {
      for (const char of env.characters) {
        const allowedDialogue = this.getDialogueForCharacter(char.id, char.dialogueId);
        if (allowedDialogue) {
          this.game.dialogueSystem.startDialogue(allowedDialogue);
          return;
        }
      }
    }

    // Prioridade 2: Objetos interativos
    if (env.objects && env.objects.length > 0) {
      const obj = env.objects[0];
      this.game.investigationSystem.investigateObject(obj);
      return;
    }

    this.game.showConsequenceToast("Não há nada com que interagir nesta etapa.");
  }

  handleExamineAction() {
    const env = this.game.data.events?.environments[this.game.state?.currentScene];
    if (!env || !env.objects || env.objects.length === 0) {
      this.game.showConsequenceToast("Você observou a sala atentamente, mas não encontrou novas anotações.");
      return;
    }

    document.querySelectorAll(".hotspot-node").forEach(node => {
      node.classList.add("highlight-hotspot-pulse");
      setTimeout(() => node.classList.remove("highlight-hotspot-pulse"), 1400);
    });

    const clueObj = env.objects.find(o => o.clueId) || env.objects[0];
    this.game.investigationSystem.investigateObject(clueObj);
  }

  handleTakeAction() {
    const currentScene = this.game.state?.currentScene;
    const missionId = this.game.state?.currentMission || 1;

    if (missionId === 3) {
      if (currentScene === "art_room") {
        if (!this.game.state.hasTakenPaints) {
          this.game.state.hasTakenPaints = true;
          this.game.showConsequenceToast("Você recolheu os frascos de tinta especial no Ateliê!");
          if (!this.game.state.discoveredClues.includes("whispered_silence")) {
            this.game.state.discoveredClues.push("whispered_silence");
          }
          this.completeObjective("m3_obj_1");
        } else {
          this.game.showConsequenceToast("Você já pegou as tintas! Agora leve-as ao Conselho Estudantil.");
        }
      } else {
        this.game.showConsequenceToast("As tintas especiais estão na Sala de Artes (Ala Norte).");
      }
    } else {
      this.game.showConsequenceToast("Nenhum objeto para recolher nesta missão.");
    }
  }

  handleDeliverAction() {
    const currentScene = this.game.state?.currentScene;
    const missionId = this.game.state?.currentMission || 1;

    if (missionId === 1) {
      if (currentScene === "literature_room") {
        this.game.dialogueSystem.startDialogue("m1_paola_delivery");
      } else {
        this.game.showConsequenceToast("A Professora está aguardando na Sala de Literatura.");
      }
    } else if (missionId === 3) {
      if (currentScene === "student_council") {
        if (this.game.state.hasTakenPaints) {
          this.game.dialogueSystem.startDialogue("m3_madison_council");
        } else {
          this.game.showConsequenceToast("Você precisa primeiro recolher as tintas na Sala de Artes.");
        }
      } else {
        this.game.showConsequenceToast("Vá até o Gabinete do Conselho Estudantil para entregar as tintas.");
      }
    } else if (missionId === 4) {
      if (currentScene === "hallway") {
        this.game.dialogueSystem.startDialogue("m4_deliver_sam");
      } else {
        this.game.showConsequenceToast("Procure Clara no Corredor Principal para entregar o comunicado.");
      }
    } else {
      this.game.showConsequenceToast("Não há entregas pendentes nesta sala.");
    }
  }

  handleObserveAction() {
    const missionId = this.game.state?.currentMission || 1;
    let observation = "";

    if (missionId === 5) {
      observation = "Rebecca nota a postura desconfortável de Melissa, afastando-se silenciosamente das carteiras do fundo.";
    } else if (missionId === 7) {
      observation = "Perto da escadaria, Clara e Sophia cercam Melissa com risadinhas e deboches. Melissa mantém a cabeça baixa.";
    } else {
      observation = "Rebecca observa o movimento calmo dos corredores da Saint Claire. As aparências são sempre impecáveis.";
    }

    this.game.dialogueSystem.startNarrativePopup("Observação de Rebecca", observation);
  }

  handleDialogueAction() {
    const env = this.game.data.events?.environments[this.game.state?.currentScene];
    if (env && env.characters && env.characters.length > 0) {
      for (const char of env.characters) {
        const allowedDialogue = this.getDialogueForCharacter(char.id, char.dialogueId);
        if (allowedDialogue) {
          this.game.dialogueSystem.startDialogue(allowedDialogue);
          return;
        }
      }
    }
  }

  handleSupportAction() {
    this.game.dialogueSystem.startNarrativePopup(
      "Acolhimento & Solidariedade",
      "Rebecca se aproxima de Melissa com calma e segurança: 'Você não precisa passar por isso sozinha. Estou aqui com você.'"
    );
  }

  handleReportAction() {
    if (this.game.state?.currentScene === "student_council") {
      this.game.dialogueSystem.startDialogue("m8_paola_report");
    } else {
      this.game.showConsequenceToast("Acompanhe Melissa até o Gabinete do Conselho para falar com a Professora.");
    }
  }

  handleObjectiveAction() {
    this.game.openNotebookModal();
    const missionTabBtn = document.querySelector('.notebook-tabs [data-tab="tab-missions"]');
    if (missionTabBtn) missionTabBtn.click();
  }

  setConfrontationMode(active) {
    this.confrontationMode = active;
    this.updateMissionUI();
  }

  updateObjectiveBanner(mission) {
    const banner = document.getElementById("active-mission-banner");
    const textEl = document.getElementById("active-mission-text");
    if (!banner || !textEl) return;

    textEl.textContent = mission.objective;
    banner.classList.add("banner-pulse-update");
    setTimeout(() => banner.classList.remove("banner-pulse-update"), 800);
  }

  /* Renderiza estritamente as missões concluídas e a ativa, ocultando 100% das futuras */
  renderProgressiveMissionsTab() {
    const container = document.getElementById("missions-list-container");
    if (!container) return;

    this.ensureProgressState();
    container.innerHTML = "";

    const currentMissionId = this.game.state.currentMission || 1;
    const completedList = this.game.state.completedMissions || [];

    // Filtra somente: concluídas e a missão atual. Futuras ficam COMPLETAMENTE OCULTAS.
    const visibleMissions = Object.values(this.MISSIONS_CONFIG).filter(m => {
      return completedList.includes(m.id) || m.id === currentMissionId;
    });

    visibleMissions.forEach(m => {
      const isCompleted = completedList.includes(m.id) && m.id !== currentMissionId;
      const isActive = m.id === currentMissionId;

      const card = document.createElement("div");
      card.className = `mission-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;

      let statusBadge = "";
      if (isCompleted) {
        statusBadge = `<span class="mission-status-pill completed">✓ Concluída</span>`;
      } else if (isActive) {
        statusBadge = `<span class="mission-status-pill active">▶ Objetivo Ativo</span>`;
      }

      // Renderiza checklist dos objetivos da missão
      const objectivesList = (m.objectives || []).map(obj => {
        const done = (this.game.state.completedObjectives || []).includes(obj.id);
        return `
          <li class="mission-objective-item ${done ? 'done' : 'pending'}">
            <span class="obj-check-icon">${done ? '✓' : '○'}</span>
            <span class="obj-text">${obj.description}</span>
          </li>
        `;
      }).join("");

      card.innerHTML = `
        <div class="mission-card-header">
          <h3 class="mission-card-title">${m.title}</h3>
          ${statusBadge}
        </div>
        <p class="mission-card-desc">${m.description}</p>
        <div class="mission-objectives-block">
          <span class="obj-block-title">ETAPAS OBRIGATÓRIAS:</span>
          <ul class="mission-objectives-ul">
            ${objectivesList}
          </ul>
        </div>
      `;

      container.appendChild(card);
    });
  }

  onMissionCompleted(completedMission, nextMission) {
    if (this.game.audio) {
      this.game.audio.playTitleChime();
    }

    // Se houver diálogo ativo na tela, aguarda o diálogo ser fechado para não sobrepor
    if (this.game.isDialogueActive || window.isDialogueActive || (this.game.dialogueSystem && this.game.dialogueSystem.layer && this.game.dialogueSystem.layer.classList.contains("active"))) {
      this.pendingCompletion = { completedMission, nextMission };
      return;
    }

    this.showCompletionModal(completedMission, nextMission);

    setTimeout(() => {
      this.updateMissionUI();
    }, 400);
  }

  showCompletionModal(completedMission, nextMission) {
    // Se acabou de concluir a última missão (Missão 8)
    const isLastMission = !nextMission || (completedMission && completedMission.id === 8);

    if (isLastMission) {
      this.showFinalEpilogueScreen();
      return;
    }

    let overlay = document.getElementById("mission-complete-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mission-complete-modal";
      overlay.className = "mission-complete-modal";
      document.getElementById("game-container")?.appendChild(overlay);
    }

    const nextTitle = nextMission ? nextMission.title : "Fim do Capítulo";
    const nextObj = nextMission ? nextMission.objective : "Você acolheu Melissa e desfez o ciclo do silêncio!";

    overlay.innerHTML = `
      <div class="mission-complete-card">
        <div class="complete-sparkle-crest">✧ ◆ ✧</div>
        <div class="complete-badge">MISSÃO CONCLUÍDA</div>
        <h2 class="complete-title">${completedMission ? completedMission.title : "Objetivo Cumprido"}</h2>
        <div class="complete-divider"></div>
        <div class="complete-next-wrap">
          <span class="next-tag">NOVO OBJETIVO DESBLOQUEADO:</span>
          <p class="next-objective">${nextObj}</p>
        </div>
        <button id="btn-dismiss-complete" class="btn-dismiss-complete">
          <span>CONTINUAR EXPLORAÇÃO</span>
          <span style="color: var(--color-dusty-pink);">➔</span>
        </button>
      </div>
    `;

    overlay.classList.add("visible");

    const dismiss = () => {
      overlay.classList.remove("visible");
      window.removeEventListener("keydown", handleKeyDismiss);
      document.body.classList.remove("dialogue-in-progress");
      this.game.isDialogueActive = false;
      window.isDialogueActive = false;
      if (this.game.state?.currentScene) {
        this.game.renderScene(this.game.state.currentScene);
      }
      this.updateMissionUI();
    };

    const handleKeyDismiss = (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        dismiss();
      }
    };

    document.getElementById("btn-dismiss-complete")?.addEventListener("click", dismiss);
    window.addEventListener("keydown", handleKeyDismiss);

    setTimeout(() => {
      if (overlay.classList.contains("visible")) {
        dismiss();
      }
    }, 4500);
  }

  /* Tela Especial de Encerramento e Reflexão */
  showFinalEpilogueScreen() {
    let epilogueOverlay = document.getElementById("final-epilogue-overlay");
    if (!epilogueOverlay) {
      epilogueOverlay = document.createElement("div");
      epilogueOverlay.id = "final-epilogue-overlay";
      epilogueOverlay.className = "final-epilogue-overlay";
      document.body.appendChild(epilogueOverlay);
    }

    epilogueOverlay.innerHTML = `
      <div class="final-epilogue-backdrop"></div>
      <div class="final-epilogue-card">
        <div class="final-epilogue-header">
          <div class="final-epilogue-crest">✦ REBECCA'S MYSTERY ✦</div>
          <h1 class="final-epilogue-title">Capítulo Concluído</h1>
        </div>
        <div class="final-epilogue-divider"></div>
        <div class="final-epilogue-body">
          <p class="final-epilogue-text">
            Nem sempre conseguimos perceber o que alguém está enfrentando por trás de um sorriso. Às vezes, um gesto de atenção, uma palavra de apoio ou simplesmente estar presente pode fazer toda a diferença.
          </p>
          <p class="final-epilogue-text">
            Não espere que alguém precise pedir ajuda para demonstrar que você se importa.
          </p>
          <div class="final-epilogue-highlight">
            "O bullying não termina quando a risada acaba."
          </div>
        </div>
        <div class="final-epilogue-divider"></div>
        <div class="final-epilogue-footer">
          <button id="btn-epilogue-finish" class="btn-epilogue-finish">
            VOLTAR AO MENU INICIAL
          </button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      epilogueOverlay.classList.add("visible");
    });

    document.getElementById("btn-epilogue-finish")?.addEventListener("click", () => {
      epilogueOverlay.classList.remove("visible");
      setTimeout(() => {
        epilogueOverlay.remove();
        if (this.game.switchScreen) {
          this.game.switchScreen("title-screen");
        }
      }, 600);
    });
  }
}

window.MissionManager = MissionManager;
