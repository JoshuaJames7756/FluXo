import PrivacyBlur from './PrivacyBlur';
import { centsToDisplay } from '../lib/money';
import './PocketCard.css';

const POCKET_ICONS = {
  Binance: '🟡',
  BNB: '🏦',
  BCP: '🏦',
  Ganadero: '🏦',
  Efectivo: '💵',
};

export default function PocketCard({ pocket, isPrivate }) {
  const borderColorVar =
    pocket.color_key === 'binance'
      ? 'var(--color-binance)'
      : pocket.color_key === 'cash'
      ? 'var(--text-main)'
      : 'var(--color-primary)';

  return (
    <div className="pocket-card" style={{ borderLeftColor: borderColorVar }}>
      <div className="pocket-info">
        <span className="pocket-icon">{POCKET_ICONS[pocket.name] || '💰'}</span>
        <div className="pocket-text">
          <span className="pocket-name">{pocket.name}</span>
          <span className="pocket-currency">{pocket.currency}</span>
        </div>
      </div>
      <PrivacyBlur isPrivate={isPrivate}>
        <span className="pocket-balance">
          {centsToDisplay(pocket.balance_cents, pocket.currency)}
        </span>
      </PrivacyBlur>
    </div>
  );
}