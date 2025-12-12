import type { Metadata } from "next";
import "./globals.css";
import { UI_CONFIG } from "@/lib/config/ui";

export const metadata: Metadata = {
  title: "Rhythmologicum Connect",
  description: "Stress- & Resilienz-Assessment Plattform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force light mode by adding 'light' class when dark mode is disabled
  const htmlClassName = UI_CONFIG.enableDarkMode ? '' : 'light'
  
  return (
    <html lang="de" className={htmlClassName}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
