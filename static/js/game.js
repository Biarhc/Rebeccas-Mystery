/**
 * Main Game Controller
 * Manages scenes, hotspots rendering, modals, HUD updates, and master game loop
 */
class GameController {
  constructor() {
    this.data = {
      characters: [],
      clues: [],
      dialogues: {},
      events: {}
    };
    this.state = null;

    this.saveSystem = window.SaveSystem;
    this.timelineSystem = new window.TimelineSystem(this);
    this.investigationSystem = new window.InvestigationSystem(this);
    this.dialogueSystem = new window.DialogueSystem(this);
    this.missionManager = new window.MissionManager(this);
    this.audio = null;
    this.isDialogueActive = false;
    window.isDialogueActive = false;
  }

  async init() {
    // Load game resources from backend
    try {
      const res = await fetch("/api/game-data");
      this.data = await res.json();
    } catch (e) {
      console.error("Could not fetch game data:", e);
    }

    this.bindDOMEvents();
    this.setupParticles();
    this.setupCinematicTitleScreen();
    this.missionManager.init();
  }

  bindDOMEvents() {
    // Screen buttons
    document.getElementById("btn-iniciar-jogo")?.addEventListener("click", () => this.startNewGame());
    document.getElementById("btn-new-game")?.addEventListener("click", () => this.startNewGame());
    document.getElementById("btn-continue")?.addEventListener("click", () => this.continueGame());
    document.getElementById("btn-continue-intro")?.addEventListener("click", () => this.continueGame());
    document.getElementById("btn-settings-title")?.addEventListener("click", () => this.openPauseModal());
    document.getElementById("btn-credits")?.addEventListener("click", () => this.openCreditsModal());

    // Sound toggle on Title Screen
    document.getElementById("btn-toggle-sound")?.addEventListener("click", () => {
      if (this.audio) {
        const isMuted = this.audio.toggleMute();
        const label = document.querySelector("#btn-toggle-sound .audio-label");
        if (label) label.textContent = isMuted ? "MUDO" : "SOM";
        this.showConsequenceToast(isMuted ? "Som desativado." : "Som ativado.");
      }
    });

    // Modals
    document.getElementById("btn-open-notebook")?.addEventListener("click", () => this.openNotebookModal());
    document.getElementById("btn-close-notebook")?.addEventListener("click", () => this.closeNotebookModal());
    document.getElementById("btn-open-menu")?.addEventListener("click", () => this.openPauseModal());
    document.getElementById("btn-close-pause")?.addEventListener("click", () => this.closePauseModal());
    document.getElementById("btn-close-credits")?.addEventListener("click", () => this.closeCreditsModal());

    // Notebook tabs
    document.querySelectorAll(".notebook-tabs .tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".notebook-tabs .tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".notebook-content-body .tab-panel").forEach(p => p.classList.remove("active"));
        
        e.currentTarget.classList.add("active");
        const tabId = e.currentTarget.getAttribute("data-tab");
        document.getElementById(tabId)?.classList.add("active");
      });
    });

    // Pause menu actions
    document.getElementById("btn-save-progress")?.addEventListener("click", () => {
      this.saveSystem.saveToServer(this.state);
      this.showConsequenceToast("Progresso gravado com sucesso.");
      this.closePauseModal();
    });

    document.getElementById("btn-restart-timeline")?.addEventListener("click", async () => {
      this.closePauseModal();
      await this.timelineSystem.triggerTimeRewind("14:30", "14 de Outubro");
    });

    document.getElementById("btn-return-title")?.addEventListener("click", () => {
      this.closePauseModal();
      this.switchScreen("title-screen");
    });

    // Keyboard Hotkeys
    window.addEventListener("keydown", (e) => {
      if (this.isDialogueActive || window.isDialogueActive) return;
      if (e.key === "Tab") {
        e.preventDefault();
        this.toggleNotebookModal();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.togglePauseModal();
      } else if (e.key === " " && document.getElementById("intro-screen").classList.contains("active")) {
        this.advanceIntro();
      }
    });

    document.getElementById("intro-screen")?.addEventListener("click", () => {
      this.advanceIntro();
    });
  }

  async startNewGame() {
    this.state = this.saveSystem.getDefaultState();
    this.startIntro();
  }

  async continueGame() {
    const loaded = await this.saveSystem.loadFromServer();
    if (loaded) {
      this.state = loaded;
      this.switchScreen("gameplay-screen");
      this.renderScene(this.state.currentScene);
      this.updateHUD();
      this.missionManager?.updateMissionUI();
      this.showConsequenceToast("Partida restaurada.");
    } else {
      this.startNewGame();
    }
  }

  /* Intro Cinematic */
  startIntro() {
    this.switchScreen("intro-screen");
    this.introParagraphs = [
      "Na tradicional Academia Saint Claire, uma escola exclusiva para garotas, o lema 'meninas apoiam meninas' decora cada vitral e mural dourado.",
      "Você é Rebecca. Para a maioria das alunas, este parecia apenas mais um dia de outono com tarefas rotineiras, aulas práticas e preparativos para eventos.",
      "Mas entre corredores silenciosos e conversas interrompidas, pequenos detalhes começam a chamar sua atenção.",
      "Melissa, uma colega quieta e reservada, parece carregar um peso invisível... sempre sorrindo sem jeito, dizendo que está tudo bem.",
      "Explore a escola, cumpra seus afazeres e observe com atenção.\n\nPorque quando o lema é apoiar... você precisa descobrir o que realmente está acontecendo."
    ];
    this.introStep = 0;
    this.renderIntroStep();
  }

  renderIntroStep() {
    const textEl = document.getElementById("intro-text");
    if (!textEl) return;

    textEl.classList.remove("visible");
    setTimeout(() => {
      textEl.textContent = this.introParagraphs[this.introStep];
      textEl.classList.add("visible");
    }, 300);
  }

  async advanceIntro() {
    this.introStep++;
    if (this.introStep < this.introParagraphs.length) {
      this.renderIntroStep();
    } else {
      this.switchScreen("gameplay-screen");
      this.renderScene(this.state.currentScene);
      this.updateHUD();
      this.missionManager?.updateMissionUI();
      this.showConsequenceToast("Missão 1 iniciada: Entregar relatórios na Biblioteca.");
    }
  }

  switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId)?.classList.add("active");
  }

  // Scene connections map — defines navigation between all environments
  static get SCENE_EXITS() {
    return {
      classroom: [
        { to: "hallway", label: "Corredor das Alunas (Piso 2)", x: 29, y: 50 }
      ],
      hallway: [
        { to: "classroom", label: "Sala de Aula 2-B", x: 14, y: 68 },
        { to: "literature_room", label: "Biblioteca & Sala de Literatura", x: 62, y: 55 },
        { to: "hallway_extended", label: "Ala Norte — Corredor", x: 92, y: 68 }
      ],
      hallway_extended: [
        { to: "hallway", label: "Corredor das Alunas (Piso 2)", x: 36, y: 64 },
        { to: "music_room", label: "Sala de Música", x: 14, y: 66 },
        { to: "art_room", label: "Ateliê de Artes", x: 84, y: 64 },
        { to: "staircase", label: "Escadaria Central & Mezanino", x: 88, y: 70 }
      ],
      music_room: [
        { to: "hallway_extended", label: "Ala Norte — Corredor", x: 14, y: 68 }
      ],
      literature_room: [
        { to: "hallway", label: "Corredor das Alunas (Piso 2)", x: 9, y: 78 }
      ],
      art_room: [
        { to: "hallway_extended", label: "Ala Norte — Corredor", x: 14, y: 68 }
      ],
      science_lab: [
        { to: "study_room", label: "Sala de Estudos Silenciosa", x: 48, y: 78 }
      ],
      student_council: [
        { to: "staircase", label: "Escadaria Central & Mezanino", x: 14, y: 68 }
      ],
      study_room: [
        { to: "staircase", label: "Escadaria Central & Mezanino", icon: "▼", x: 14, y: 68 },
        { to: "science_lab", label: "Laboratório de Ciências", x: 86, y: 68 }
      ],
      staircase: [
        { to: "hallway_extended", label: "Ala Norte — Corredor", icon: "▼", x: 16, y: 80 },
        { to: "study_room", label: "Sala de Estudos Silenciosa", icon: "▲", x: 63, y: 78 },
        { to: "student_council", label: "Gabinete do Conselho & Orientação", x: 18, y: 65 }
      ]
    };
  }

  changeScene(sceneId) {
    if (this.isDialogueActive || window.isDialogueActive) return;
    if (!this.data.events.environments[sceneId]) return;
    this.state.currentScene = sceneId;
    this.renderScene(sceneId);
    this.timelineSystem.advanceTime(5);
    this.missionManager?.checkMissionCompletion();
    this.missionManager?.updateMissionUI();
  }

  renderScene(sceneId) {
    const env = this.data.events.environments[sceneId];
    if (!env) return;

    // Background Art — PNG preferred, then JPG, then SVG
    const bgArt = document.getElementById("scene-artwork");
    if (bgArt) {
      const pngScenes = ["classroom", "hallway", "music_room"];
      const jpgScenes = ["hallway_extended", "literature_room", "art_room",
                         "science_lab", "student_council", "staircase", "study_room"];
      if (pngScenes.includes(sceneId)) {
        bgArt.style.backgroundImage = `url('/static/images/scenes/${sceneId}.png')`;
      } else if (jpgScenes.includes(sceneId)) {
        bgArt.style.backgroundImage = `url('/static/images/scenes/${sceneId}.jpg')`;
      } else {
        bgArt.style.backgroundImage = `url('/static/images/scenes/${sceneId}.svg')`;
      }
    }

    // Top HUD
    document.getElementById("hud-location-name").textContent = env.name;
    document.getElementById("hud-location-ambience").textContent = env.ambience;

    // Render Hotspots and Sprites — Garante limpeza total sem duplicações
    const container = document.getElementById("hotspots-container");
    container.innerHTML = "";

    const currentMissionId = this.state?.currentMission || 1;

    // Hotspots (Objects)
    (env.objects || []).forEach(obj => {
      // 1. O bilhete amassado no corredor só deve surgir a partir da Missão 4 (evita duplicar OBSERVAR na M1/M2/M3)
      if (obj.id === "crumpled_paper_hall" && currentMissionId < 4) {
        return;
      }
      // 2. Se o Caderno Azul já foi coletado na biblioteca, ele não fica mais sobre a mesa
      if (obj.id === "blue_notebook_lit" && this.state?.hasTakenBlueNotebook) {
        return;
      }
      // 3. O hotspot de entrega da Professora na Sala de Literatura só aparece na Missão 1
      if (obj.id === "teacher_desk_lit" && currentMissionId !== 1) {
        return;
      }

      // Check if action allowed by current mission
      const currentConfig = this.missionManager ? this.missionManager.getCurrentMissionConfig() : null;
      const isAllowed = !currentConfig || !currentConfig.allowedHotspotActions || currentConfig.allowedHotspotActions.includes(obj.action);

      const node = document.createElement("div");
      node.className = `hotspot-node ${!isAllowed ? 'hotspot-restricted' : ''}`;
      node.style.left = `${obj.x}%`;
      node.style.top = `${obj.y}%`;
      node.innerHTML = `
        <div class="hotspot-marker" title="${obj.action}: ${obj.name}">
          <svg class="ui-icon-lens" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10.5" cy="10.5" r="6.5"></circle>
            <line x1="15.5" y1="15.5" x2="21" y2="21"></line>
            <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" opacity="0.6"></circle>
          </svg>
        </div>
        <div class="hotspot-badge">${obj.action}: ${obj.name}</div>
      `;
      node.addEventListener("click", () => {
        if (this.isDialogueActive || window.isDialogueActive) return;
        if (!isAllowed) {
          this.showConsequenceToast(`Ação '${obj.action}' indisponível no momento. Foque no seu objetivo.`);
          return;
        }
        this.investigationSystem.investigateObject(obj);
      });
      container.appendChild(node);
    });

    // Characters in scene
    (env.characters || []).forEach(char => {
      // Verifica se o personagem possui diálogo ativo e essencial na missão atual nesta cena
      const activeDialogueId = this.missionManager ? this.missionManager.getDialogueForCharacter(char.id, char.dialogueId) : null;
      if (!activeDialogueId) {
        // Personagens só aparecem no cenário quando são essenciais para a missão ser concluída
        return;
      }

      // Normaliza o nome para o formato oficial (SAM em destaque, Professora, Clara, Sophia, Melissa)
      let displayName = char.name;
      const lowerRaw = (char.id || "").toLowerCase();
      const lowerName = (displayName || "").toLowerCase();
      if (lowerRaw === "sam" || lowerName === "sam" || lowerName.startsWith("sam ")) {
        displayName = "SAM";
      } else if (lowerRaw === "paola" || lowerName.includes("paola") || lowerName.includes("elizabeth") || lowerRaw === "professora") {
        displayName = "Professora";
      } else if (displayName.includes(" ")) {
        displayName = displayName.split(" ")[0];
      }

      // Determina a foto correspondente à personagem oficial
      let avatarFileName = "rebecca.png";
      const cleanLower = displayName.toLowerCase();
      if (cleanLower === "sam") {
        avatarFileName = "sam.png";
      } else if (cleanLower === "melissa") {
        avatarFileName = "melissa.png";
      } else if (cleanLower === "clara") {
        avatarFileName = "clara.png";
      } else if (cleanLower === "sophia") {
        avatarFileName = "sophia.png";
      } else if (cleanLower === "professora") {
        avatarFileName = "professora.png";
      } else {
        const charInfo = (this.data.characters || []).find(c => c.id === char.id);
        avatarFileName = charInfo ? charInfo.avatar.replace("static/images/avatars/", "") : "rebecca.png";
      }

      const avatarSrc = `/static/images/avatars/${avatarFileName}`;

      const isPassive = activeDialogueId === "__passive__";
      const node = document.createElement("div");
      node.className = "character-sprite-node";
      node.style.left = `${char.x}%`;
      node.style.top = `${char.y}%`;
      node.innerHTML = `
        <div class="character-portrait-card-pin" title="${isPassive ? displayName : `Conversar com ${displayName}`}">
          <div class="character-portrait-pin-frame">
            <img class="character-portrait-pin-img" src="${avatarSrc}" alt="${displayName}">
            ${isPassive ? "" : `<div class="character-portrait-pin-bubble">
              <svg class="ui-icon-speech" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>`}
          </div>
          <div class="sprite-name-tag">
            ${displayName}
          </div>
        </div>
      `;

      node.addEventListener("click", () => {
        if (isPassive) return;
        if (this.isDialogueActive || window.isDialogueActive) return;
        if (activeDialogueId && (!this.missionManager || this.missionManager.isDialogueAllowed(activeDialogueId))) {
          this.dialogueSystem.startDialogue(activeDialogueId);
        }
      });
      container.appendChild(node);
    });

    // Helper SVG for scene transition footsteps
    const getFootprintSVG = () => `
      <svg class="ui-icon-steps" viewBox="0 0 32 32" width="24" height="24" fill="currentColor">
        <!-- Pegada esquerda -->
        <g transform="translate(4, 5) rotate(-12)">
          <ellipse cx="6" cy="14" rx="3.5" ry="5.5"/>
          <ellipse cx="6.5" cy="5.5" rx="4" ry="4.5"/>
          <circle cx="3.5" cy="0.5" r="1.1"/>
          <circle cx="6" cy="0" r="1.1"/>
          <circle cx="8.5" cy="0.6" r="1"/>
          <circle cx="10.8" cy="1.6" r="0.8"/>
        </g>
        <!-- Pegada direita avançando -->
        <g transform="translate(16, 0) rotate(10)">
          <ellipse cx="6" cy="14" rx="3.5" ry="5.5"/>
          <ellipse cx="6.5" cy="5.5" rx="4" ry="4.5"/>
          <circle cx="3.5" cy="0.5" r="1.1"/>
          <circle cx="6" cy="0" r="1.1"/>
          <circle cx="8.5" cy="0.6" r="1"/>
          <circle cx="10.8" cy="1.6" r="0.8"/>
        </g>
      </svg>
    `;

    // Exit nodes (footprint navigation)
    const exits = GameController.SCENE_EXITS[sceneId] || [];
    const positionedExits = exits.filter(e => e.x !== undefined && e.y !== undefined);
    const unpositionedExits = exits.filter(e => e.x === undefined || e.y === undefined);

    // Render exits positioned directly on scene coordinates
    positionedExits.forEach(exit => {
      const targetEnv = this.data.events.environments[exit.to];
      const exitLabel = exit.label || (targetEnv ? targetEnv.name : exit.to);
      const node = document.createElement("div");
      node.className = "scene-exit-node scene-exit-node--placed";
      node.style.left = `${exit.x}%`;
      node.style.top = `${exit.y}%`;
      node.setAttribute("aria-label", `Ir para ${exitLabel}`);
      const iconContent = exit.icon 
        ? `<span class="exit-custom-icon">${exit.icon}</span>` 
        : getFootprintSVG();
      const labelTopClass = (exit.y && exit.y > 80) ? "exit-label--top" : "";
      node.innerHTML = `
        <div class="exit-footprints">
          ${iconContent}
        </div>
        <div class="exit-label ${labelTopClass}">${exitLabel}</div>
      `;
      node.addEventListener("click", () => {
        if (this.isDialogueActive || window.isDialogueActive) return;
        this.changeScene(exit.to);
      });
      container.appendChild(node);
    });

    // Render any remaining unpositioned exits grouped by side
    const sides = { left: [], right: [] };
    unpositionedExits.forEach(e => (sides[e.side || 'left'] || (sides[e.side || 'left'] = [])).push(e));

    ['left', 'right'].forEach(side => {
      if (!sides[side] || sides[side].length === 0) return;
      const wrapper = document.createElement('div');
      wrapper.className = `scene-exits-group scene-exits-group--${side}`;
      sides[side].forEach(exit => {
        const targetEnv = this.data.events.environments[exit.to];
        const exitLabel = exit.label || (targetEnv ? targetEnv.name : exit.to);
        const node = document.createElement("div");
        node.className = `scene-exit-node`;
        node.setAttribute("aria-label", `Ir para ${exitLabel}`);
        const iconContent = exit.icon 
          ? `<span class="exit-custom-icon">${exit.icon}</span>` 
          : getFootprintSVG();
        node.innerHTML = `
          <div class="exit-footprints">
            ${iconContent}
          </div>
          <div class="exit-label">${exitLabel}</div>
        `;
        node.addEventListener("click", () => {
        if (this.isDialogueActive || window.isDialogueActive) return;
        this.changeScene(exit.to);
      });
        wrapper.appendChild(node);
      });
      container.appendChild(wrapper);
    });
  }


  advanceMission(completedMissionId) {
    if (!this.state) return;
    const current = this.state.currentMission || 1;
    if (completedMissionId === current) {
      const nextMissionId = current + 1;
      const missions = this.data.missions || [];
      const currentMissionData = missions.find(m => m.id === current);
      const nextMissionData = missions.find(m => m.id === nextMissionId);

      // Reward clue if any
      if (currentMissionData && currentMissionData.clueReward) {
        if (!this.state.discoveredClues.includes(currentMissionData.clueReward)) {
          this.state.discoveredClues.push(currentMissionData.clueReward);
        }
      }

      // Add diary entry
      if (currentMissionData && currentMissionData.diaryEntry) {
        this.state.diaryEntries.unshift({
          date: `${currentMissionData.title}`,
          text: currentMissionData.diaryEntry
        });
      }

      if (nextMissionData) {
        this.state.currentMission = nextMissionId;
        this.missionManager?.onMissionCompleted(currentMissionData, nextMissionData);
        this.updateHUD();
      } else {
        this.missionManager?.onMissionCompleted(currentMissionData, null);
        this.showConsequenceToast("Você completou todas as missões da Academia Saint Claire!");
        this.updateHUD();
      }

      this.saveSystem.saveToServer(this.state);
    }
  }

  updateHUD() {
    if (!this.state) return;
    const dateEl = document.getElementById("hud-date-text");
    if (dateEl) dateEl.textContent = `${this.state.day.toUpperCase()} — ${this.state.date.toUpperCase()}`;
    
    const clockEl = document.getElementById("hud-clock-text");
    if (clockEl) clockEl.textContent = this.state.time;

    const missionBadge = document.getElementById("hud-mission-badge");
    const missionId = this.state.currentMission || 1;
    if (missionBadge) missionBadge.textContent = `Missão ${missionId}/8`;

    const missionTextEl = document.getElementById("active-mission-text");
    if (missionTextEl) {
      const currentM = (this.data.missions || []).find(m => m.id === missionId);
      missionTextEl.textContent = currentM ? currentM.objective : "Explorar a Academia Saint Claire";
    }
    this.missionManager?.updateMissionUI();
  }

  getCurrentSceneName() {
    return this.data.events.environments[this.state?.currentScene]?.name || "Academia Saint Claire";
  }

  showConsequenceToast(msg) {
    // Se o jogador já estiver no meio de um diálogo, não exibe toasts de indisponibilidade
    if (this.dialogueSystem && this.dialogueSystem.layer && this.dialogueSystem.layer.classList.contains("active")) {
      return;
    }

    const toast = document.getElementById("consequence-toast");
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3800);
  }

  /* Modals */
  openNotebookModal() {
    this.investigationSystem.renderMissionsTab();
    this.investigationSystem.renderCluesTab();
    this.investigationSystem.renderDiaryTab();
    this.investigationSystem.renderCharactersTab();
    document.getElementById("notebook-modal")?.classList.add("active");
  }

  closeNotebookModal() {
    document.getElementById("notebook-modal")?.classList.remove("active");
  }

  toggleNotebookModal() {
    const modal = document.getElementById("notebook-modal");
    if (modal.classList.contains("active")) {
      this.closeNotebookModal();
    } else {
      this.openNotebookModal();
    }
  }

  openPauseModal() {
    document.getElementById("pause-modal")?.classList.add("active");
  }

  closePauseModal() {
    document.getElementById("pause-modal")?.classList.remove("active");
  }

  togglePauseModal() {
    const modal = document.getElementById("pause-modal");
    if (modal.classList.contains("active")) {
      this.closePauseModal();
    } else {
      this.openPauseModal();
    }
  }

  openCreditsModal() {
    document.getElementById("credits-modal")?.classList.add("active");
  }

  closeCreditsModal() {
    document.getElementById("credits-modal")?.classList.remove("active");
  }

  /* Atmospheric Ambient Particles */
  setupParticles() {
    const canvas = document.getElementById("particles-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 1,
        speedY: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#B47A9A";

      particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < 0) p.y = h;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ========================================================
     CINEMATIC INTRO SCREEN MANAGER (5 a 8s)
     ======================================================== */
  setupCinematicTitleScreen() {
    const titleScreen = document.getElementById("title-screen");
    if (!titleScreen) return;

    let isIntroSequenceDone = false;
    const fastForwardHint = document.getElementById("intro-fastforward-hint");

    // Configura canvas de partículas cinematográficas (poeira suspensa e pétalas flutuantes)
    this.setupIntroCanvasParticles();

    // Rotação contínua sutil dos ponteiros do relógio antigo no brasão
    this.setupCrestClock();

    // Efeito suave de mouse parallax
    const stage = document.getElementById("title-parallax-stage");
    window.addEventListener("mousemove", (e) => {
      if (!titleScreen.classList.contains("active") || isReducedMotion()) return;
      const xRatio = (e.clientX / window.innerWidth) - 0.5;
      const yRatio = (e.clientY / window.innerHeight) - 0.5;
      
      const layerCorridor = stage?.querySelector(".layer-dark-depth");
      const layerWindows = stage?.querySelector(".layer-windows-light");
      const layerCurtains = stage?.querySelector(".layer-curtains");
      
      if (layerCorridor) layerCorridor.style.transform = `scale(1.08) translate(${xRatio * -18}px, ${yRatio * -12}px)`;
      if (layerWindows) layerWindows.style.transform = `translate(${xRatio * -30}px, ${yRatio * -20}px)`;
      if (layerCurtains) layerCurtains.style.transform = `translate(${xRatio * 15}px, ${yRatio * 10}px)`;
    });

    function isReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // Função para pular ou acelerar a animação
    const completeSequenceInstantly = () => {
      if (isIntroSequenceDone) return;
      isIntroSequenceDone = true;
      titleScreen.classList.remove("cinematic-intro-state");
      titleScreen.classList.add(
        "cinematic-stage-revealed",
        "cinematic-crest-revealed",
        "cinematic-title-revealed",
        "cinematic-subtitle-revealed",
        "cinematic-ready"
      );
      if (fastForwardHint) fastForwardHint.style.display = "none";
      if (this.audio) {
        this.audio.startAmbience();
        this.audio.playTitleChime();
      }
    };

    // Pular abertura com Enter ou clique antes do botão aparecer
    const handleSkip = (e) => {
      if (!isIntroSequenceDone && titleScreen.classList.contains("active")) {
        if (e.key === "Enter" || e.type === "click") {
          completeSequenceInstantly();
        }
      }
    };
    window.addEventListener("keydown", handleSkip);
    titleScreen.addEventListener("click", (e) => {
      if (!isIntroSequenceDone && !e.target.closest("button")) {
        completeSequenceInstantly();
      }
    });

    // Se preferir movimento reduzido, completa instantaneamente
    if (isReducedMotion()) {
      completeSequenceInstantly();
      return;
    }

    // Mostra dica de skip após 1.5s
    setTimeout(() => {
      if (!isIntroSequenceDone && fastForwardHint) fastForwardHint.classList.add("visible");
    }, 1500);

    // Passo 1 (0s): Tela quase escura (já começa por padrão)
    // Passo 2 (0.8s): Revela corredor da Saint Claire suavemente
    setTimeout(() => {
      if (!isIntroSequenceDone) {
        titleScreen.classList.add("cinematic-stage-revealed");
        if (this.audio) this.audio.startAmbience();
      }
    }, 800);

    // Passo 3 (2.5s): Surge o Brasão da Academia Saint Claire
    setTimeout(() => {
      if (!isIntroSequenceDone) {
        titleScreen.classList.add("cinematic-crest-revealed");
      }
    }, 2400);

    // Passo 4 (4.0s): Título REBECCA'S MYSTERY surge com efeito luminoso refinado
    setTimeout(() => {
      if (!isIntroSequenceDone) {
        titleScreen.classList.add("cinematic-title-revealed");
        if (this.audio) this.audio.playTitleChime();
      }
    }, 3900);

    // Passo 5 (5.4s): Surge o subtítulo oficial
    setTimeout(() => {
      if (!isIntroSequenceDone) {
        titleScreen.classList.add("cinematic-subtitle-revealed");
      }
    }, 5300);

    // Passo 6 (6.5s): Botão INICIAR JOGO surge gradualmente
    setTimeout(() => {
      if (!isIntroSequenceDone) {
        titleScreen.classList.add("cinematic-ready");
        isIntroSequenceDone = true;
        if (fastForwardHint) fastForwardHint.classList.remove("visible");
      }
    }, 6500);
  }

  /* Rotação dos ponteiros do relógio antigo no brasão */
  setupCrestClock() {
    const hourHand = document.getElementById("crest-clock-hour");
    const minuteHand = document.getElementById("crest-clock-minute");
    if (!hourHand || !minuteHand) return;

    let minuteAngle = 0;
    let hourAngle = 0;

    function tickClock() {
      minuteAngle += 0.35;
      hourAngle += 0.03;
      // Rotaciona ao redor do centro cx=60, cy=62
      minuteHand.setAttribute("transform", `rotate(${minuteAngle} 60 62)`);
      hourHand.setAttribute("transform", `rotate(${hourAngle} 60 62)`);
      requestAnimationFrame(tickClock);
    }
    tickClock();
  }

  /* Partículas da Abertura: Poeira em suspensão e fragmentos rosados/pétalas */
  setupIntroCanvasParticles() {
    const canvas = document.getElementById("intro-particles-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const items = [];
    // Poeira sutil iluminada (35 partículas)
    for (let i = 0; i < 35; i++) {
      items.push({
        type: "dust",
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.5 + 0.2,
        color: "#F3E9EC"
      });
    }

    // Pétalas e fragmentos de memória flutuantes (22 partículas)
    for (let i = 0; i < 22; i++) {
      items.push({
        type: "petal",
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 4 + 3,
        speedX: (Math.random() * 0.5 + 0.1),
        speedY: (Math.random() * 0.4 + 0.15),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        alpha: Math.random() * 0.5 + 0.25,
        color: Math.random() > 0.4 ? "#B47A9A" : "#5E3A5C"
      });
    }

    function render() {
      ctx.clearRect(0, 0, w, h);

      items.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === "dust") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Pétala estilizada delicada
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          p.rotation += p.rotSpeed;
        }

        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x > w + 10) p.x = -10;
        if (p.x < -10) p.x = w + 10;
        if (p.y > h + 10) p.y = -10;
        if (p.y < -10) p.y = h + 10;
      });

      requestAnimationFrame(render);
    }
    render();
  }
}

window.GameController = GameController;
