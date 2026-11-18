/**
 * Timeline and Time Traversal System
 * Tracks timeline state (A, B, C) and time jumps
 */
class TimelineSystem {
  constructor(game) {
    this.game = game;
  }

  async triggerTimeRewind(targetTime = "14:30", targetDate = "14 de Outubro") {
    const overlay = document.getElementById("time-rewind-overlay");
    if (overlay) {
      overlay.classList.add("active");
    }

    // Play subtle synthesized rewind glitch audio effect
    if (this.game.audio) {
      this.game.audio.playGlitchSound();
    }

    await new Promise((resolve) => setTimeout(resolve, 2400));

    // Update game time and rollback
    this.game.state.time = targetTime;
    this.game.state.date = targetDate;
    this.game.updateHUD();

    if (overlay) {
      overlay.classList.remove("active");
    }

    this.game.showConsequenceToast("A linha do tempo foi alterada.");
  }

  recalculateTimeline() {
    const cluesCount = this.game.state.discoveredClues.length;
    const trustChloe = this.game.state.relationships.chloe?.trust || 0;
    const trustSophia = this.game.state.relationships.sophia?.trust || 0;

    let newTimeline = "A";
    if (cluesCount >= 3 && trustChloe >= 45) {
      newTimeline = "C";
    } else if (cluesCount >= 1 || trustChloe >= 35 || trustSophia >= 30) {
      newTimeline = "B";
    }

    if (this.game.state.timeline !== newTimeline) {
      this.game.state.timeline = newTimeline;
      this.game.showConsequenceToast(`Linha do tempo mudou para: Linha ${newTimeline}`);
      this.game.updateHUD();
    }
  }

  advanceTime(minutes = 15) {
    this.game.state.minutesElapsed += minutes;
    const totalMinutes = 14 * 60 + 30 + this.game.state.minutesElapsed;
    const hours = Math.floor((totalMinutes / 60) % 24).toString().padStart(2, '0');
    const mins = (totalMinutes % 60).toString().padStart(2, '0');
    this.game.state.time = `${hours}:${mins}`;
    this.game.updateHUD();
  }
}

window.TimelineSystem = TimelineSystem;
