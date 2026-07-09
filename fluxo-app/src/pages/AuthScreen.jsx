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
            colorPrimary: '#06B6D4',
            colorBackground: '#1E2638',
            colorText: '#F8FAFC',
            colorTextSecondary: '#64748B',
            colorInputBackground: '#0B111E',
            colorInputText: '#F8FAFC',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}