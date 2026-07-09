import PrivacyBlur from './PrivacyBlur';
import { centsToDisplay } from '../lib/money';
import './PocketCard.css';

const renderPocketIcon = (name) => {
  switch (name) {
    case 'Binance':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-binance)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l9 4.5V17.5L12 22l-9-4.5V6.5L12 2z"/>
          <path d="M12 22V12"/>
          <path d="M21 6.5L12 12 3 6.5"/>
        </svg>
      );
    case 'Efectivo':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <circle cx="12" cy="12" r="2"/>
          <path d="M6 12h.01M18 12h.01"/>
        </svg>
      );
    case 'BNB':
    case 'BCP':
    case 'Ganadero':
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
        </svg>
      );
  }
};

export default function PocketCard({ pocket, isPrivate }) {
  const borderColorVar =
    pocket.color_key === 'binance'
      ? 'var(--color-binance)'
      : pocket.color_key === 'cash'
      ? 'var(--text-muted)'
      : 'var(--color-primary)';

  return (
    <div className="pocket-card" style={{ borderLeftColor: borderColorVar }}>
      <div className="pocket-info">
        <div className="pocket-icon-wrapper">
          {renderPocketIcon(pocket.name)}
        </div>
        <div className="pocket-text">
          <span className="pocket-name">{pocket.name}</span>
          <span className="pocket-currency">{pocket.currency}</span>
        </div>
      </div>
      <div className="pocket-balance-wrapper">
        <PrivacyBlur isPrivate={isPrivate}>
          <span className="pocket-balance">
            {centsToDisplay(pocket.balance_cents, pocket.currency)}
          </span>
        </PrivacyBlur>
      </div>
    </div>
  );
}