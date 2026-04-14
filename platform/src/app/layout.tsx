import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uzbekistan Economic Policy Lab",
  description:
    "Real-time economic models and policy analysis for Uzbekistan — GDP Nowcasting, Dynamic Factor Models, and more.",
  keywords: ["Uzbekistan", "GDP", "Nowcasting", "Economic Policy", "DFM", "CEER"],
  openGraph: {
    title: "Uzbekistan Economic Policy Lab",
    description: "Real-time economic models and policy analysis for Uzbekistan",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
