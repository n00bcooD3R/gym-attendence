import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { NavProvider } from "@/components/NavContext";

export const metadata: Metadata = {
  title: "GymTrack — Attendance Management System",
  description: "Premium gym attendance management with eSSL biometric device integration. Real-time fingerprint & face attendance tracking.",
  keywords: "gym, attendance, biometric, eSSL, fingerprint, face recognition, ZKTeco",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </NavProvider>
      </body>
    </html>
  );
}
