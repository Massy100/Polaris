import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import ConditionalPanel from "./components/conditional-panel";
import NotificationWrapper from "./components/notification-wrapper";

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
              <NotificationWrapper />
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}