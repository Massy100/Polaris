'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AdminDashboardPanel from "./components/admin-dashboard-panel";
import { useRouter, usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex">
          <AdminDashboardPanel 
            activePath={pathname} 
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            userName="Kevin Miguel Yax Puác"
          />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}