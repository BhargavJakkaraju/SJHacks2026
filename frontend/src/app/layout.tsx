import type { Metadata } from "next";
import { Margarine } from "next/font/google";
import "./globals.css";

const margarine = Margarine({
  weight: "400",
  variable: "--font-margarine",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bloom",
  description: "An IDE for Artists | Boundless and Accessible Creativity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${margarine.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
