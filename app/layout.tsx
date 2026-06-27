import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site-O-Mattic Demo Catalog",
  description:
    "A riso-style sales demo for Playground-ready WordPress Blueprint sites.",
  icons: {
    icon: "/blueprints/lawn-care-service/assets/favicon.png",
    shortcut: "/blueprints/lawn-care-service/assets/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
