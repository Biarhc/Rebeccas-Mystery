/**
 * Investigation System
 * Manages inspectable hotspots, clues, and diary reflections
 */
class InvestigationSystem {
  constructor(game) {
    this.game = game;
  }

  investigateObject(obj) {
    // Play inspect sound
    if (this.game.audio) this.game.audio.playInspectSound();

    // Advance time slightly
    this.game.timelineSystem.advanceTime(5);

    // If this object holds a clue and haven't discovered yet
    if (obj.clueId && !this.game.state.discoveredClues.includes(obj.clueId)) {
      this.game.state.discoveredClues.push(obj.clueId);
      const clue = this.game.data.clues.find(c => c.id === obj.clueId);
      
      // Notify player
      this.game.showConsequenceToast(`Nova pista descoberta: ${clue ? clue.name : 'Pista misteriosa'}`);

      // Add diary thought reflection
      this.game.state.diaryEntries.unshift({
        date: `${this.game.state.date} — ${this.game.state.time}`,
        text: `Encontrei uma nova pista em ${this.game.getCurrentSceneName()}: "${clue ? clue.name : ''}". ${obj.narrative}`
      });

      this.game.timelineSystem.recalculateTimeline();
    }

    // Coleta do Caderno de Literatura Azul na Missão 2
    if (obj.id === "blue_notebook_lit") {
      this.game.state.hasTakenBlueNotebook = true;
      if (this.game.missionManager) {
        this.game.missionManager.completeObjective("m2_obj_1");
        this.game.missionManager.updateMissionUI();
      }
      this.game.showConsequenceToast("Você recolheu o Caderno de Literatura Azul! Entregue-o para Sophia.");
    }

    // Open an inspect dialogue popup with object narrative
    this.game.dialogueSystem.startNarrativePopup(obj.name, obj.narrative);

    // Mark as investigated
    if (!this.game.state.investigatedObjects.includes(obj.id)) {
      this.game.state.investigatedObjects.push(obj.id);
    }
  }

  renderCluesTab() {
    const container = document.getElementById("clues-list-grid");
    if (!container) return;

    container.innerHTML = "";
    const discovered = this.game.data.clues.filter(c => this.game.state.discoveredClues.includes(c.id));

    if (discovered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--color-dusty-pink); padding: 40px; font-family: var(--font-pixel); font-size: 1.3rem;">Nenhuma pista descoberta ainda.<br>Examine o ambiente da escola com atenção.</div>`;
      return;
    }

    discovered.forEach(clue => {
      const card = document.createElement("div");
      card.className = "clue-card";
      card.innerHTML = `
        <div class="clue-card-header">
          <span class="clue-category">${clue.category}</span>
          <span style="font-size: 0.8rem; color: var(--color-dusty-pink); font-family: var(--font-pixel);">${clue.dateFound}</span>
        </div>
        <h4 class="clue-title">${clue.name}</h4>
        <p class="clue-desc">${clue.description}</p>
        <div class="clue-footer">📍 Local: ${clue.location} — ${clue.impact}</div>
      `;
      container.appendChild(card);
    });
  }

  renderDiaryTab() {
    const container = document.getElementById("diary-entries-list");
    if (!container) return;

    container.innerHTML = "";
    this.game.state.diaryEntries.forEach(entry => {
      const block = document.createElement("div");
      block.className = "diary-entry";
      block.innerHTML = `
        <div class="diary-date">
          <svg class="diary-date-svg" viewBox="0 0 20 20" width="14" height="14" fill="currentColor" style="vertical-align: -2px; margin-right: 6px; color: var(--color-dusty-pink);">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
          </svg>
          ${entry.date}
        </div>
        <div class="diary-text">${entry.text}</div>
      `;
      container.appendChild(block);
    });
  }

  renderCharactersTab() {
    const container = document.getElementById("characters-list-grid");
    if (!container) return;

    container.innerHTML = "";
    this.game.data.characters.forEach(char => {
      if (char.id === "rebecca") return;
      const rel = this.game.state.relationships[char.id] || { trust: 20, friendship: 20, suspicion: 30 };
      const displayName = char.id === "sam" ? "SAM" : char.name;
      
      const card = document.createElement("div");
      card.className = "char-card";
      card.innerHTML = `
        <div class="char-portrait-container">
          <div class="char-portrait-frame">
            <img src="/${char.avatar}" alt="${displayName}" class="char-portrait-img">
          </div>
          <div class="char-portrait-name">${displayName}</div>
        </div>
        <div class="char-info">
          <div class="char-role">${char.role} (${char.age} anos)</div>
          
          <div class="relation-bar-wrap">
            <div class="relation-label"><span>Confiança</span><span>${rel.trust}%</span></div>
            <div class="relation-bar"><div class="relation-fill" style="width: ${rel.trust}%;"></div></div>
          </div>

          <div class="relation-bar-wrap">
            <div class="relation-label"><span>Amizade</span><span>${rel.friendship}%</span></div>
            <div class="relation-bar"><div class="relation-fill" style="width: ${rel.friendship}%; background: var(--color-plum);"></div></div>
          </div>

          <div class="relation-bar-wrap">
            <div class="relation-label"><span>Suspeita</span><span>${rel.suspicion}%</span></div>
            <div class="relation-bar"><div class="relation-fill" style="width: ${rel.suspicion}%; background: #9c3f58;"></div></div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderMissionsTab() {
    if (this.game.missionManager) {
      this.game.missionManager.renderProgressiveMissionsTab();
      return;
    }
    const container = document.getElementById("missions-list-container");
    if (!container) return;

    container.innerHTML = "";
    const missions = this.game.data.missions || [];
    const currentMissionId = this.game.state.currentMission || 1;

    missions.forEach(m => {
      const card = document.createElement("div");
      const isCompleted = currentMissionId > m.id;
      const isActive = currentMissionId === m.id;
      
      card.className = `mission-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
      
      let statusLabel = "Bloqueada";
      let statusClass = "locked";
      if (isCompleted) {
        statusLabel = "✓ Concluída";
        statusClass = "completed";
      } else if (isActive) {
        statusLabel = "▶ Em Andamento";
        statusClass = "active";
      }

      card.innerHTML = `
        <div class="mission-card-header">
          <h3 class="mission-card-title">${m.title}</h3>
          <span class="mission-status-pill ${statusClass}">${statusLabel}</span>
        </div>
        <p class="mission-card-desc"><strong>Objetivo:</strong> ${m.objective}</p>
        <div style="font-size: 0.88rem; color: var(--color-dusty-pink); font-family: var(--font-pixel); margin-top: 4px;">
          ${m.summary}
        </div>
      `;
      container.appendChild(card);
    });
  }
}

window.InvestigationSystem = InvestigationSystem;
