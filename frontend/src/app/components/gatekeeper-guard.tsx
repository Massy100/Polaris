'use client';

import { useAuth, useClerk, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function GatekeeperGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (authLoaded && userLoaded && isSignedIn && clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const fullName = clerkUser.fullName || '';

      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/access-vault/identity/`, {
        headers: { 
          'X-Clerk-ID': userId || '',
          'X-Clerk-Email': email,
          'X-Clerk-Name': fullName
        }
      })
      .then(r => r.json())
      .then(d => setVaultStatus(d?.identity?.registration_status || 'WAITING'))
      .catch(() => setVaultStatus('WAITING'));
    }
  }, [authLoaded, userLoaded, isSignedIn, userId, clerkUser]);

  if (!authLoaded || !userLoaded || (isSignedIn && vaultStatus === null)) {
    return (
      <div className="loading-vault-container">
        <div className="vault-loader"></div>
        <span>Verificando Bóveda de Seguridad...</span>
      </div>
    );
  }

  const isAuthRoute = ['/sign-in', '/sign-up'].some(r => pathname.startsWith(r));
  if (isAuthRoute) return <>{children}</>;

  if (isSignedIn && vaultStatus !== 'APPROVED') {
    return (
      <div className="vault-notification-overlay">
        <div className="vault-notification-card">
          <div className={`vault-status-indicator ${vaultStatus?.toLowerCase()}`}></div>
          <div className="vault-content">
            <img src="/login-logo.png" alt="Polaris Logo" className="vault-mini-logo" />
            <h3>{vaultStatus === 'DENIED' ? 'Acceso Denegado' : 'Registro en Proceso'}</h3>
            <p>
              {vaultStatus === 'DENIED' 
                ? 'Su solicitud fue rechazada por el administrador. Contacte al equipo de soporte técnico para una solución.' 
                : 'Su cuenta ha sido vinculada exitosamente. Un administrador debe aprobar su acceso antes de ingresar al sistema.'}
            </p>
            <div className="vault-actions">
              <button 
                className="vault-btn-exit" 
                onClick={() => signOut(() => window.location.href = '/sign-in')}
              >
                Cerrar Sesión y Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
