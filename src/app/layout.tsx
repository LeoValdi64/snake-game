import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RetroSnake - Classic Snake Game | Play Free Online",
  description: "Play the classic Snake game with a retro arcade twist! Control the snake, eat food, grow longer, and beat your high score. Free online game with keyboard and mobile touch controls.",
  keywords: ["snake game", "retro game", "arcade game", "classic snake", "online game", "free game", "browser game"],
  authors: [{ name: "Gaspi" }],
  openGraph: {
    title: "RetroSnake - Classic Snake Game",
    description: "Play the classic Snake game with a retro arcade twist! Beat your high score!",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RetroSnake - Classic Snake Game",
    description: "Play the classic Snake game with a retro arcade twist!",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#0f0f23",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
