import { useState } from 'react';
import './ChipSelect.css';

interface ChipSelectProps {
  onStart: (chips: number) => void;
  onBack: () => void;
  message?: string;
}

const PRESETS = [100, 500, 1000, 5000];

export function ChipSelect({ onStart, onBack, message }: ChipSelectProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [selected, setSelected] = useState<number>(500);

  const handleStart = () => {
    const amount = customAmount ? parseInt(customAmount) : selected;
    if (amount && amount >= 10) {
      onStart(amount);
    }
  };

  return (
    <div className="chip-select">
      <button className="btn-back cs-back" onClick={onBack}>&larr; Back</button>

      <div className="cs-content">
        {message && <div className="cs-message">{message}</div>}
        <h2 className="cs-title">Choose Your Buy-In</h2>
        <p className="cs-subtitle">How many chips would you like to start with?</p>

        <div className="cs-presets">
          {PRESETS.map(amount => (
            <button
              key={amount}
              className={`cs-preset ${selected === amount && !customAmount ? 'cs-preset-selected' : ''}`}
              onClick={() => { setSelected(amount); setCustomAmount(''); }}
            >
              ${amount.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="cs-custom">
          <span className="cs-or">or</span>
          <input
            type="number"
            className="cs-input"
            placeholder="Custom amount..."
            min={10}
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); }}
          />
        </div>

        <button className="btn btn-primary btn-large cs-start" onClick={handleStart}>
          Take a Seat
        </button>
      </div>
    </div>
  );
}
