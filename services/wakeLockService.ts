/**
 * Wake Lock Service
 * 
 * Prevents the screen from locking on mobile devices using:
 * 1. Screen Wake Lock API (modern browsers)
 * 2. NoSleep.js-style video fallback (older browsers)
 */

// Base64-encoded tiny silent MP4 video for NoSleep fallback
// This is a minimal valid MP4 that plays silently and loops
const SILENT_VIDEO_BASE64 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA+ltZGF0AAACrwYF//+r3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1OSByMjk5MSAxNzcxYjU1IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOSAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAPmWIhAAv//72rvzLK0cLlS4dWXuzUfLoSXL9iDB9aAAAAwAAAwAAD/A/PAPcAAAAAwAAHNAAYGEAAAADAAADAGAAAAAMJZYJ';

// WebM fallback for browsers that don't support MP4
const SILENT_VIDEO_WEBM_BASE64 = 'data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQN8VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5NhkBKFIJG5AEhTwGDgQCEloECPt9RBZyBACK1nEADdW5NhkBKFIJG5AEhTwGDgQCEloECPt9RBZyBACK1nEADdW5NhkBKFIJG5AEhTwGDgQCEloECPt9RBZyBACK1nEADdW5NhkBKFIJG5AEhTwGDgQCEloECPt9RBZyBACK1nEADdW5NhkBKFIJG5AEhTwGDgQCEloEC';

class WakeLockService {
  private wakeLock: WakeLockSentinel | null = null;
  private noSleepVideo: HTMLVideoElement | null = null;
  private enabled: boolean = false;
  private visibilityHandler: (() => void) | null = null;

  /**
   * Check if the Screen Wake Lock API is supported
   */
  isWakeLockSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  /**
   * Check if wake lock functionality is available (API or fallback)
   */
  isSupported(): boolean {
    // Wake lock API or video fallback should work on most browsers
    return true;
  }

  /**
   * Enable wake lock to prevent screen from sleeping
   */
  async enable(): Promise<void> {
    if (this.enabled) return;
    this.enabled = true;

    if (this.isWakeLockSupported()) {
      await this.enableWakeLockAPI();
    } else {
      this.enableNoSleepFallback();
    }
  }

  /**
   * Disable wake lock and allow screen to sleep normally
   */
  async disable(): Promise<void> {
    if (!this.enabled) return;
    this.enabled = false;

    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch (e) {
        // Ignore release errors
      }
      this.wakeLock = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    this.disableNoSleepFallback();
  }

  /**
   * Enable using the Screen Wake Lock API
   */
  private async enableWakeLockAPI(): Promise<void> {
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      
      // Handle wake lock release (e.g., when tab becomes hidden)
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
      });

      // Re-acquire wake lock when page becomes visible again
      this.visibilityHandler = async () => {
        if (this.enabled && document.visibilityState === 'visible' && !this.wakeLock) {
          try {
            this.wakeLock = await navigator.wakeLock.request('screen');
          } catch (e) {
            // If wake lock fails on visibility change, try fallback
            console.warn('Wake lock re-acquisition failed, using fallback');
            this.enableNoSleepFallback();
          }
        }
      };

      document.addEventListener('visibilitychange', this.visibilityHandler);
    } catch (e) {
      // Wake Lock API failed (e.g., low battery mode on iOS)
      // Fall back to video method
      console.warn('Wake Lock API failed, using video fallback:', e);
      this.enableNoSleepFallback();
    }
  }

  /**
   * Enable using the NoSleep.js-style video fallback
   * This works by playing a silent video in a loop which prevents the screen from sleeping
   */
  private enableNoSleepFallback(): void {
    if (this.noSleepVideo) return;

    this.noSleepVideo = document.createElement('video');
    this.noSleepVideo.setAttribute('playsinline', '');
    this.noSleepVideo.setAttribute('muted', '');
    this.noSleepVideo.setAttribute('loop', '');
    this.noSleepVideo.muted = true;
    this.noSleepVideo.loop = true;
    
    // Style to hide the video element
    this.noSleepVideo.style.position = 'absolute';
    this.noSleepVideo.style.left = '-9999px';
    this.noSleepVideo.style.top = '-9999px';
    this.noSleepVideo.style.width = '1px';
    this.noSleepVideo.style.height = '1px';
    this.noSleepVideo.style.opacity = '0';
    this.noSleepVideo.style.pointerEvents = 'none';

    // Try MP4 first, then WebM
    const sourceMP4 = document.createElement('source');
    sourceMP4.src = SILENT_VIDEO_BASE64;
    sourceMP4.type = 'video/mp4';
    
    const sourceWebM = document.createElement('source');
    sourceWebM.src = SILENT_VIDEO_WEBM_BASE64;
    sourceWebM.type = 'video/webm';

    this.noSleepVideo.appendChild(sourceMP4);
    this.noSleepVideo.appendChild(sourceWebM);
    
    document.body.appendChild(this.noSleepVideo);

    // Try to play the video
    const playPromise = this.noSleepVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        // Autoplay was prevented, need user interaction
        // We'll try again on the next user interaction
        console.warn('NoSleep video autoplay prevented:', e);
        
        const playOnInteraction = () => {
          if (this.noSleepVideo && this.enabled) {
            this.noSleepVideo.play().catch(() => {});
          }
          document.removeEventListener('touchstart', playOnInteraction);
          document.removeEventListener('click', playOnInteraction);
        };
        
        document.addEventListener('touchstart', playOnInteraction, { once: true });
        document.addEventListener('click', playOnInteraction, { once: true });
      });
    }

    // Handle visibility change for fallback too
    if (!this.visibilityHandler) {
      this.visibilityHandler = () => {
        if (this.enabled && document.visibilityState === 'visible' && this.noSleepVideo) {
          this.noSleepVideo.play().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  /**
   * Disable the NoSleep video fallback
   */
  private disableNoSleepFallback(): void {
    if (this.noSleepVideo) {
      this.noSleepVideo.pause();
      if (this.noSleepVideo.parentNode) {
        this.noSleepVideo.parentNode.removeChild(this.noSleepVideo);
      }
      this.noSleepVideo = null;
    }
  }

  /**
   * Get the current enabled state
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const wakeLockService = new WakeLockService();
