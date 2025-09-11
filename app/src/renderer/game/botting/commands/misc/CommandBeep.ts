import { Command } from "@botting/command";

async function beep(frequency = 800, duration = 200): Promise<void> {
  return new Promise((resolve) => {
    const audioContext = new window.AudioContext();
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
    oscillator.onended = () => resolve();
  });
}

export class CommandBeep extends Command {
  public times!: number;

  public override async execute() {
    for (let idx = 0; idx < this.times; idx++) {
      await beep();
      await this.bot.sleep(50);
    }
  }

  public override toString() {
    if (this.times === 1) return "Beep";

    return `Beep ${this.times}x`;
  }
}
