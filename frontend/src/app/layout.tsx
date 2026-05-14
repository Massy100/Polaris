import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import ConditionalPanel from "./components/conditional-panel";
import NotificationBell from "./components/notification-bell";

export const metadata: Metadata = {
  title: "SGA • Polaris",
  description: "Sistema de Gestión Académica - Universidad Rafael Landívar",
  icons: {
    icon: "/login-logo.png",
    apple: "/login-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="antialiased">
          <div className="flex relative">
            <ConditionalPanel />
            <main className="flex-1 overflow-auto relative">
              <div className="nb-floating-wrapper">
                <NotificationBell />
              </div>
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}