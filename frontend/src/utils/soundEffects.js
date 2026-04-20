// Sound Effects Manager for RideWise

class SoundManager {
  constructor() {
    this.sounds = {
      click: this.createTone(800, 0.1, 'sine'),
      success: this.createSuccessSound(),
      error: this.createTone(200, 0.2, 'sawtooth'),
      notification: this.createNotificationSound(),
      search: this.createTone(600, 0.15, 'triangle'),
    };
  }

  createTone(frequency, duration, type = 'sine') {
    return () => {
      if (!this.isEnabled()) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };
  }

  createSuccessSound() {
    return () => {
      if (!this.isEnabled()) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    };
  }

  createNotificationSound() {
    return () => {
      if (!this.isEnabled()) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.1); // C6

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };
  }

  isEnabled() {
    const settings = localStorage.getItem('settings_soundEffects');
    return settings === null || JSON.parse(settings) === true;
  }

  play(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  }

  playClick() { this.play('click'); }
  playSuccess() { this.play('success'); }
  playError() { this.play('error'); }
  playNotification() { this.play('notification'); }
  playSearch() { this.play('search'); }
}

export const soundManager = new SoundManager();
