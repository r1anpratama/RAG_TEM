import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeismoAgent-TW | Decoupled RAG Platform",
  description:
    "Decoupled RAG webapp with FastAPI backend token-by-token streaming and Next.js App Router.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
