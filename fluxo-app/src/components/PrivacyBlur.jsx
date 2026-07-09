import './PrivacyBlur.css';

/**
 * Envuelve cualquier valor monetario. Cuando isPrivate = true,
 * aplica blur manteniendo las dimensiones del layout intactas
 * (evita reflow / saltos de UI al activar el modo privado).
 */
export default function PrivacyBlur({ isPrivate, children }) {
  return (
    <span className={`privacy-blur ${isPrivate ? 'is-private' : ''}`}>
      {children}
    </span>
  );
}