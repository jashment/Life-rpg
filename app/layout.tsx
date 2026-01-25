import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "LifeRPG - Level Up Your Life",
    description: "A gamified habit tracker that turns your daily tasks into epic quests.",
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
