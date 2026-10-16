// Zero-cost Web Speech API manager for AI Teammates Meeting Mode
// Speech synthesis (TTS) and speech recognition (STT) require zero API keys and incur zero token costs.

export interface TeammateVoiceConfig {
  pitch: number;
  rate: number;
  preferredVoices: string[];
}

// Consistent, distinct voice profiles per teammate
export const TEAMMATE_VOICES: Record<string, TeammateVoiceConfig> = {
  Atlas: {
    pitch: 0.88,
    rate: 1.0,
    preferredVoices: ['Google UK English Male', 'Daniel', 'Alex', 'David', 'Arthur', 'en-GB']
  },
  Elena: {
    pitch: 1.18,
    rate: 1.05,
    preferredVoices: ['Google US English', 'Samantha', 'Victoria', 'Karen', 'Zira', 'en-US']
  },
  Nova: {
    pitch: 1.0,
    rate: 1.1,
    preferredVoices: ['Google UK English Female', 'Moira', 'Fiona', 'Stephanie', 'en-GB']
  },
  Marcus: {
    pitch: 0.82,
    rate: 0.96,
    preferredVoices: ['Fred', 'Google US English Male', 'George', 'Tom', 'en-US']
  },
  Iris: {
    pitch: 1.22,
    rate: 1.0,
    preferredVoices: ['Tessa', 'Google US English Female', 'Serena', 'Ava', 'en-US']
  },
  Coordinator: {
    pitch: 1.04,
    rate: 1.02,
    preferredVoices: ['Google US English', 'Samantha', 'Daniel', 'Alex', 'en-US']
  }
};

class MeetingVoiceManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isMuted: boolean = false;
  private isPaused: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private recognition: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices() || [];
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Mobile Safari / Chrome audio unlock primer.
   * Call on user touch gesture ("Start meeting" button tap).
   */
  public unlockAudio(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.resume();
      const primer = new SpeechSynthesisUtterance('');
      primer.volume = 0;
      primer.rate = 10;
      window.speechSynthesis.speak(primer);
    } catch (e) {
      console.warn('[VOICE] Audio unlock attempted:', e);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.isPaused = false;
    }
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking && !window.speechSynthesis.paused;
  }

  /**
   * Speaks a turn with the teammate's distinct voice, pitch, and rate.
   * If voice is muted or unavailable, falls back to text reading timer.
   */
  public speakTurn(
    speakerName: string,
    speakerRole: string,
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): () => void {
    this.stop();

    const wordCount = text.trim().split(/\s+/).length;
    // Reading duration fallback: approx 260ms per word + 1.2s base
    const readingTimeMs = Math.max(2200, Math.min(10000, wordCount * 260 + 1200));

    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onStart?.();
      const timer = setTimeout(() => {
        onEnd?.();
      }, readingTimeMs);
      return () => clearTimeout(timer);
    }

    const voiceConfig = TEAMMATE_VOICES[speakerName] || TEAMMATE_VOICES[speakerRole] || {
      pitch: 1.0,
      rate: 1.0,
      preferredVoices: []
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = voiceConfig.pitch;
    utterance.rate = voiceConfig.rate;

    // Pick matching voice
    const available = this.getVoices();
    let selectedVoice = available.find(v =>
      voiceConfig.preferredVoices.some(pref => v.name.includes(pref) || v.lang.includes(pref))
    );

    if (!selectedVoice && available.length > 0) {
      selectedVoice = available[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    let ended = false;
    const safeEnd = () => {
      if (!ended) {
        ended = true;
        this.currentUtterance = null;
        onEnd?.();
      }
    };

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      safeEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[VOICE] Speech synthesis error:', e);
      safeEnd();
    };

    this.currentUtterance = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VOICE] Speech synthesis failed:', err);
      // Fallback timer
      const timer = setTimeout(safeEnd, readingTimeMs);
      return () => clearTimeout(timer);
    }

    return () => {
      this.stop();
      safeEnd();
    };
  }

  /**
   * Starts Speech Recognition (Web Speech API STT) for user interruptions.
   * Zero cost, client-side, falls back to typing gracefully.
   */
  public startSpeechRecognition(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      onError('Speech recognition is not supported in this browser. Please type your message.');
      return false;
    }

    try {
      this.stopSpeechRecognition();

      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onFinal(finalTranscript.trim());
        } else if (interimTranscript) {
          onInterim(interimTranscript.trim());
        }
      };

      rec.onerror = (event: any) => {
        let message = 'Microphone input error.';
        if (event.error === 'not-allowed') {
          message = 'Microphone access blocked. Please allow microphone in browser settings or type your message.';
        } else if (event.error === 'no-speech') {
          message = 'No speech heard. You can try speaking again or type.';
        }
        onError(message);
      };

      rec.onend = () => {
        this.recognition = null;
        onEnd();
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (err: any) {
      console.warn('[VOICE] Failed to start speech recognition:', err);
      onError(err?.message || 'Could not start microphone.');
      return false;
    }
  }

  public stopSpeechRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Ignore
      }
      this.recognition = null;
    }
  }
}

export const meetingVoice = new MeetingVoiceManager();
