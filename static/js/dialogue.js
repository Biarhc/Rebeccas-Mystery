/**
 * Dialogue System
 * Handles typewriter effects, choices tree, relationship changes, and Omori-styled dialogue boxes
 */
class DialogueSystem {
  constructor(game) {
    this.game = game;
    this.currentDialogueNode = null;
    this.isTyping = false;
    this.typingInterval = null;
    this.layer = document.getElementById("dialogue-layer");
    this.speakerEl = document.getElementById("dialogue-speaker");
    this.textEl = document.getElementById("dialogue-content");
    this.avatarEl = document.getElementById("dialogue-avatar");
    this.choicesContainer = document.getElementById("dialogue-choices");
    this.arrowEl = document.getElementById("dialogue-arrow");

    this.bindEvents();
  }

  bindEvents() {
    if (this.arrowEl) {
      this.arrowEl.addEventListener("click", () => this.advanceOrSkip());
    }
  }

  startDialogue(dialogueKey, isContinuation = false) {
    // Validação estrita de desbloqueio de diálogos por missão (apenas ao iniciar nova conversa)
    if (!isContinuation && this.game.missionManager && !this.game.missionManager.isDialogueAllowed(dialogueKey)) {
      this.closeDialogue();
      return;
    }

    const node = this.game.data.dialogues[dialogueKey];
    if (!node) {
      console.warn("Dialogue node not found:", dialogueKey);
      this.closeDialogue();
      return;
    }

    // Ativa bloqueio global de interações externas durante diálogo
    this.game.isDialogueActive = true;
    window.isDialogueActive = true;
    document.body.classList.add("dialogue-in-progress");

    this.currentDialogueNode = node;
    this.layer.classList.add("active");
    this.layer.classList.remove("narrative-mode");

    // Registra diálogo desbloqueado e acessado (após ativar a camada de diálogo para não interromper a fala)
    this.game.missionManager?.completeDialogue(dialogueKey);

    // Ajusta tamanho da caixa para textos curtos
    if (node.text && node.text.length < 110) {
      this.layer.classList.add("compact-dialogue");
    } else {
      this.layer.classList.remove("compact-dialogue");
    }

    // Mostra o retrato no diálogo de personagem
    const portraitWrapper = this.layer.querySelector(".dialogue-portrait-wrapper");
    if (portraitWrapper) {
      portraitWrapper.style.display = "flex";
    }

    let speakerName = node.speaker || "Rebecca";
    if (speakerName.toLowerCase() === "sam") {
      speakerName = "SAM";
    }
    this.speakerEl.textContent = speakerName;
    this.avatarEl.src = node.avatar ? `/${node.avatar}` : "/static/images/avatars/rebecca.png";
    
    // Ativa modo confronto na Missão 7 para adaptar os botões de ação
    if (dialogueKey.startsWith("m7_") || this.game.state?.currentMission === 7) {
      this.game.missionManager?.setConfrontationMode(true);
    }

    this.typewriteText(node.text, () => {
      this.showChoices(node.choices || []);
    });
  }

  startNarrativePopup(title, text) {
    this.game.isDialogueActive = true;
    window.isDialogueActive = true;
    document.body.classList.add("dialogue-in-progress");

    this.layer.classList.add("active");
    this.layer.classList.add("narrative-mode");

    // Diálogos narrativos e inspeções curtas usam caixa compacta
    if (!text || text.length < 130) {
      this.layer.classList.add("compact-dialogue");
    } else {
      this.layer.classList.remove("compact-dialogue");
    }

    // Ao investigar objetos, NÃO exibe foto de personagem
    const portraitWrapper = this.layer.querySelector(".dialogue-portrait-wrapper");
    if (portraitWrapper) {
      portraitWrapper.style.display = "none";
    }

    this.speakerEl.textContent = title;
    this.choicesContainer.innerHTML = "";

    this.typewriteText(text, () => {
      this.choicesContainer.innerHTML = `
        <button class="choice-card-btn" onclick="window.gameInstance.dialogueSystem.closeDialogue()">
          <span style="color: var(--color-dusty-pink);">▶</span> Fechar Inspeção
        </button>
      `;
    });
  }

  typewriteText(text, onComplete) {
    if (this.typingInterval) clearInterval(this.typingInterval);
    this.isTyping = true;
    this.textEl.textContent = "";
    this.choicesContainer.innerHTML = "";
    this.arrowEl.style.display = "none";

    let index = 0;
    this.typingInterval = setInterval(() => {
      if (index < text.length) {
        this.textEl.textContent += text.charAt(index);
        index++;
        if (index % 3 === 0 && this.game.audio) {
          this.game.audio.playBlipSound();
        }
      } else {
        clearInterval(this.typingInterval);
        this.isTyping = false;
        this.arrowEl.style.display = "block";
        if (onComplete) onComplete();
      }
    }, 24);
  }

  advanceOrSkip() {
    if (this.isTyping) {
      clearInterval(this.typingInterval);
      this.isTyping = false;
      this.textEl.textContent = this.currentDialogueNode ? this.currentDialogueNode.text : this.textEl.textContent;
      this.arrowEl.style.display = "block";
      if (this.currentDialogueNode && this.currentDialogueNode.choices) {
        this.showChoices(this.currentDialogueNode.choices);
      }
    } else {
      // If no choices, check for mission advancement on close
      if (!this.currentDialogueNode || !this.currentDialogueNode.choices || this.currentDialogueNode.choices.length === 0) {
        if (this.currentDialogueNode && this.currentDialogueNode.missionAdvance) {
          this.game.advanceMission(this.currentDialogueNode.missionAdvance);
        }
        this.closeDialogue();
      }
    }
  }

  showChoices(choices) {
    this.choicesContainer.innerHTML = "";
    if (!choices || choices.length === 0) {
      this.choicesContainer.innerHTML = `
        <button class="choice-card-btn" onclick="window.gameInstance.dialogueSystem.closeDialogue()">
          <span style="color: var(--color-dusty-pink);">▶</span> Terminar Conversa
        </button>
      `;
      return;
    }

    choices.forEach((choice, idx) => {
      // Check condition
      if (choice.condition === "has_clue_deleted_sms" && !this.game.state.discoveredClues.includes("deleted_sms")) {
        return;
      }
      if (choice.condition === "has_clue_torn_note" && !this.game.state.discoveredClues.includes("torn_note")) {
        return;
      }

      const btn = document.createElement("button");
      btn.className = "choice-card-btn";
      btn.innerHTML = `<span style="color: var(--color-dusty-pink); font-family: var(--font-pixel); margin-right: 6px;">[${idx + 1}]</span> ${choice.text}`;
      btn.addEventListener("click", () => {
        this.handleChoiceSelect(choice);
      });
      this.choicesContainer.appendChild(btn);
    });
  }

  handleChoiceSelect(choice) {
    if (this.game.audio) this.game.audio.playChoiceSound();

    // Apply Relationship and Consequences
    if (choice.effect) {
      const speakerId = (this.currentDialogueNode.speaker || "").toLowerCase();
      if (this.game.state.relationships[speakerId]) {
        if (choice.effect.trust) this.game.state.relationships[speakerId].trust += choice.effect.trust;
        if (choice.effect.friendship) this.game.state.relationships[speakerId].friendship += choice.effect.friendship;
        if (choice.effect.suspicion) this.game.state.relationships[speakerId].suspicion += choice.effect.suspicion;
      }

      if (choice.effect.prompt) {
        this.game.showConsequenceToast(choice.effect.prompt);
      }
    }

    // Time advance
    this.game.timelineSystem.advanceTime(5);

    // Continue to next node or close (only advance mission when dialogue actually closes)
    if (choice.next && this.game.data.dialogues[choice.next]) {
      this.startDialogue(choice.next, true);
    } else {
      this.closeDialogue();
    }
  }

  closeDialogue() {
    this.game.isDialogueActive = false;
    window.isDialogueActive = false;
    document.body.classList.remove("dialogue-in-progress");

    if (this.currentDialogueNode && this.currentDialogueNode.missionAdvance) {
      this.game.advanceMission(this.currentDialogueNode.missionAdvance);
    }
    this.game.missionManager?.setConfrontationMode(false);
    this.layer.classList.remove("active");
    this.layer.classList.remove("narrative-mode");
    this.layer.classList.remove("compact-dialogue");

    // Restaura exibição padrão da moldura de retrato para o próximo diálogo
    const portraitWrapper = this.layer.querySelector(".dialogue-portrait-wrapper");
    if (portraitWrapper) {
      portraitWrapper.style.display = "flex";
    }

    this.currentDialogueNode = null;

    if (this.game.state?.currentScene) {
      this.game.renderScene(this.game.state.currentScene);
    }

    // Se havia um modal de missão concluída aguardando o fim do diálogo, exibe agora sem sobreposição
    if (this.game.missionManager && this.game.missionManager.pendingCompletion) {
      const pending = this.game.missionManager.pendingCompletion;
      this.game.missionManager.pendingCompletion = null;
      setTimeout(() => {
        this.game.missionManager.showCompletionModal(pending.completedMission, pending.nextMission);
        this.game.missionManager.updateMissionUI();
      }, 300);
    }
  }
}

window.DialogueSystem = DialogueSystem;
