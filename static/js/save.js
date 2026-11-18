/**
 * Save System Module
 * Handles local storage & Flask server session persistence
 */
class SaveSystem {
  constructor() {
    this.STORAGE_KEY = "rebeccas_mystery_save_v3";
  }

  getDefaultState() {
    return {
      currentScene: "classroom",
      currentMission: 1,
      timeline: "A",
      day: "Segunda-feira",
      date: "Academia Saint Claire",
      time: "08:15",
      minutesElapsed: 0,
      discoveredClues: [],
      investigatedObjects: [],
      diaryEntries: [
        {
          date: "Manhã — Academia Saint Claire",
          text: "Mais um dia comum na Saint Claire. O lema 'Meninas apoiam meninas' decora os corredores. Preciso entregar uma pasta de relatórios para a professora Paola na biblioteca."
        }
      ],
      relationships: {
        melissa: { trust: 25, friendship: 25, suspicion: 10 },
        madison: { trust: 15, friendship: 10, suspicion: 40 },
        chloe: { trust: 20, friendship: 25, suspicion: 35 },
        valery: { trust: 35, friendship: 30, suspicion: 15 },
        sam: { trust: 30, friendship: 20, suspicion: 20 },
        paola: { trust: 25, friendship: 15, suspicion: 20 }
      },
      completedMissions: [],
      completedObjectives: [],
      completedDialogues: [],
      dialogueHistory: []
    };
  }

  saveLocally(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error("Local storage save error:", e);
      return false;
    }
  }

  loadLocally() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Local storage load error:", e);
      return null;
    }
  }

  async saveToServer(state) {
    try {
      this.saveLocally(state);
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      });
      return await res.json();
    } catch (e) {
      console.warn("Backend save failed, saved locally instead:", e);
      return { success: true };
    }
  }

  async loadFromServer() {
    try {
      const res = await fetch("/api/load");
      const data = await res.json();
      if (data && data.success && data.state) {
        return data.state;
      }
    } catch (e) {
      console.warn("Backend load failed, checking local storage:", e);
    }
    return this.loadLocally();
  }

  async resetProgress() {
    localStorage.removeItem(this.STORAGE_KEY);
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch (e) {
      console.warn("Server reset ignored:", e);
    }
    return this.getDefaultState();
  }
}

window.SaveSystem = new SaveSystem();
