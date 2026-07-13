import "./globals.css";

export const metadata = {
  title: "Endless Flight",
  description: "An ambient interactive flight experience",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}