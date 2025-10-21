import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";

interface MoneyAnimationProps {
  amount: number;
  x: number;
  y: number;
  onComplete: () => void;
}

// Money "cha-ching" sound
let audioContextInstance: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (audioContextInstance) return audioContextInstance;
  try {
    audioContextInstance = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    return audioContextInstance;
  } catch (e) {
    console.log("Audio context not supported");
    return null;
  }
};

const MONEY_SOUND = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    const now = audioContext.currentTime;

    // Create oscillator for "cha-ching" effect
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc1.frequency.value = 800;
    osc2.frequency.value = 600;

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioContext.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  } catch (e) {
    console.log("Error playing sound:", e);
  }
};

export default function MoneyAnimation({
  amount,
  x,
  y,
  onComplete,
}: MoneyAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Play money sound
    try {
      MONEY_SOUND();
    } catch (e) {
      console.log("Audio context not available");
    }

    // Animate out after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed pointer-events-none transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: isVisible
          ? "translateY(-80px) scale(1)"
          : "translateY(-150px) scale(0.8)",
      }}
    >
      <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg">
        <DollarSign className="h-4 w-4" />
        <span>+${amount.toFixed(2)}</span>
      </div>
    </div>
  );
}
