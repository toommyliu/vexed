import { Command } from "../../command";

async function beep(
  audioContext: AudioContext,
  frequency = 800,
  duration = 200,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1_000,
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1_000);
    oscillator.onended = () => {
      try {
        oscillator.disconnect();
        gainNode.disconnect();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
  });
}

export class CommandBeep extends Command {
  public times!: number;

  public override async executeImpl() {
    const audioContext = new AudioContext();

    try {
      for (let idx = 0; idx < this.times; idx++) {
        await beep(audioContext, 800, 200);
        await this.bot.sleep(50);
      }
    } finally {
      await audioContext.close();
    }
  }

  public override toString() {
    if (this.times === 1) return "Beep";

    return `Beep ${this.times}x`;
  }
}
