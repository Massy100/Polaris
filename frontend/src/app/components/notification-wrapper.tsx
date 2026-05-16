'use client';

import NotificationBell from './notification-bell';

/**
 * Componente que envuelve la campana de notificaciones con su posicionamiento flotante.
 * Se debe colocar manualmente en las vistas donde se desee mostrar el centro de notificaciones.
 */
export default function NotificationWrapper() {
  return (
    <div className="nb-floating-wrapper">
      <NotificationBell />
    </div>
  );
}
