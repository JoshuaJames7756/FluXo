import './PrivacyBlur.css';

export default function PrivacyBlur({ isPrivate, children }) {
  return (
    <span className={`privacy-blur ${isPrivate ? 'is-private' : ''}`}>
      {children}
    </span>
  );
}