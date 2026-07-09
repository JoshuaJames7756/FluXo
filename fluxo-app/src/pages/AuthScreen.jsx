import { SignIn } from '@clerk/clerk-react';
import './AuthScreen.css';

export default function AuthScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-branding">
        <span className="auth-logo">X</span>
        <h1 className="auth-title">FluXo</h1>
        <p className="auth-subtitle">Tu flujo de caja, bajo control total.</p>
      </div>

      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#06B6D4',       // Cyan principal
            colorBackground: '#131A26',     // Fondo oscuro base uniforme
            colorText: '#F8FAFC',           // Texto principal claro
            colorTextSecondary: '#94A3B8',  // Gris legible para textos secundarios
            colorInputBackground: '#0B111E', // Inputs muy oscuros
            colorInputText: '#F8FAFC',
            borderRadius: '12px',
          },
          elements: {
            rootBox: "clerk-root-override",
            card: "clerk-card-override",
            headerTitle: "clerk-header-title",
            headerSubtitle: "clerk-header-subtitle",
            socialButtonsBlockButton: "clerk-social-btn",
            socialButtonsBlockButtonText: "clerk-social-btn-text",
            dividerLine: "clerk-divider-line",
            dividerText: "clerk-divider-text",
            formFieldLabel: "clerk-field-label",
            formFieldInput: "clerk-field-input",
            formButtonPrimary: "clerk-submit-btn",
            footerActionLink: "clerk-footer-link",
            footer: "clerk-footer-override"
          }
        }}
      />
    </div>
  );
}