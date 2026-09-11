import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeismoAgent-TW | RAG Model Dashboard",
  description:
    "Decoupled Agentic RAG for Seismic Hazard & Real-Time Emergency Triage in Taiwan - NCU E-DREaM Lab x NVAITC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate_obsidian-900 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
