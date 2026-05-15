import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dyno plots",
  description:
    "Compare dyno runs from MWD and Horacio Resio dynos — fully client-side.",
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
