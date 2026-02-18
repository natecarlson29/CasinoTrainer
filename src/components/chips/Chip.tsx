import type { ChipDenomination } from '../../types/common';
import { CHIP_COLORS, CHIP_LABELS } from '../../types/common';
import './Chip.css';

interface ChipProps {
  denomination: ChipDenomination;
  onClick?: () => void;
  size?: 'small' | 'normal';
  disabled?: boolean;
}

export function Chip({ denomination, onClick, size = 'normal', disabled = false }: ChipProps) {
  return (
    <button
      className={`chip chip-${size} ${disabled ? 'chip-disabled' : ''}`}
      style={{ backgroundColor: CHIP_COLORS[denomination] }}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="chip-value">{CHIP_LABELS[denomination]}</span>
    </button>
  );
}
