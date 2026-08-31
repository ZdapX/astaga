import "./globals.css";

export const metadata = {
  title: "DAPA — Sign in",
  description: "Simple modern authentication interface.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
