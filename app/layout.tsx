import { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Wexo CRM — WhatsApp Control Center",
  description: "Premium WhatsApp automation dashboard powered by Wasender API",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface h-screen overflow-hidden font-inter">
        {children}
      </body>
    </html>
  );
}
