/**
 * Notification Sound Manager
 * Plays sound alerts for different notification types
 */

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize on user interaction to comply with browser autoplay policies
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('notification_sound_enabled') !== 'false';
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play a notification sound
   */
  async playNotificationSound(type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: [523.25, 659.25, 783.99], // C5, E5, G5 (pleasant chord)
        info: [440, 554.37], // A4, C#5 (neutral)
        warning: [392, 493.88], // G4, B4 (attention)
        error: [329.63, 293.66] // E4, D4 (alert)
      };

      const notes = frequencies[type];
      let time = ctx.currentTime;

      // Play each note in sequence
      for (const freq of notes) {
        oscillator.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        time += 0.15;
      }

      oscillator.start(ctx.currentTime);
      oscillator.stop(time);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * Enable notification sounds
   */
  enable() {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_sound_enabled', 'true');
    }
  }

  /**
   * Disable notification sounds
   */
  disable() {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_sound_enabled', 'false');
    }
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const notificationSound = new NotificationSoundManager();
