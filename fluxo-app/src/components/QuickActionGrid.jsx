import './QuickActionGrid.css';

const QUICK_ACTIONS = [
  { label: '-2 Bs Trufi', amountCents: 200, categoryName: 'Transporte' },
  { label: '-19 Bs Almuerzo', amountCents: 1500, categoryName: 'Almuerzo' },
  { label: '-10 Bs Taxi', amountCents: 500, categoryName: 'Transporte' },
  { label: '-10 Bs Refrigerio', amountCents: 1000, categoryName: 'Gastos Hormiga' },
];

export default function QuickActionGrid({ onQuickAction }) {
  return (
    <div className="quick-action-grid">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          className="quick-action-btn"
          onClick={() => onQuickAction(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}