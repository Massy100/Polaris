'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../audit/audit.css';
import './alert-config.css';

export default function AlertConfigPage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="url-page-bg flex-1">
      {showToast && (
        <div className="audit-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Configuración de alertas guardada
        </div>
      )}

      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <header className="settings-header">
          <button onClick={() => router.push('/settings')} className="settings-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Configuración
          </button>
          <h1 className="settings-title">Reglas de Notificación</h1>
          <p className="settings-subtitle">Gestiona los disparadores de avisos automáticos para el personal administrativo y docente.</p>
        </header>

        <div className="audit-panel">
          <div className="audit-panel-header">
            <div className="audit-panel-title">
              <div className="url-icon-chip url-icon-chip--navy">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <h2>Configuración de Alertas</h2>
                <p>Personaliza quién recibe avisos según el tipo de evento.</p>
              </div>
            </div>
          </div>

          <div className="audit-table-wrap" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
              <h3 className="alert-config-label">Alertas para Administradores</h3>
              <div className="alert-item-list">
                <AlertItem 
                  title="Bajo Desempeño Crítico" 
                  desc="Notificar cuando un curso tenga más del 40% de alumnos en riesgo."
                  defaultChecked
                />
                <AlertItem 
                  title="Carga de Pensum Completa" 
                  desc="Confirmación cuando los procesos de importación masiva finalizan."
                  defaultChecked
                />
                <AlertItem 
                  title="Intentos de Acceso Fallidos" 
                  desc="Aviso tras 3 intentos fallidos de cualquier administrador."
                />
              </div>
            </section>

            <section>
              <h3 className="alert-config-label">Alertas para Docentes</h3>
              <div className="alert-item-list">
                <AlertItem 
                  title="Recordatorio de Calificaciones" 
                  desc="Avisar 48h antes de la fecha límite de entrega de actas."
                  defaultChecked
                />
                <AlertItem 
                  title="Nuevos Mensajes de Alumnos" 
                  desc="Notificar al docente cuando un estudiante envíe una consulta."
                  defaultChecked
                />
                <AlertItem 
                  title="Cambios en el Horario" 
                  desc="Notificación inmediata si se modifica el salón o hora de clase."
                  defaultChecked
                />
              </div>
            </section>
          </div>

          <div className="audit-panel-footer">
            <button className="url-btn url-btn-primary url-btn-sm" onClick={handleSave}>Guardar Configuración</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function AlertItem({ title, desc, defaultChecked = false }: { title: string, desc: string, defaultChecked?: boolean }) {
  return (
    <div className="alert-config-card">
      <div className="alert-config-info">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
      <label className="profile-toggle">
        <input type="checkbox" defaultChecked={defaultChecked} />
        <span className="profile-toggle-track" />
      </label>
    </div>
  );
}