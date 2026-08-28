import "./globals.css";

export const metadata = {
  title: "Medical Lab Report Generator",
  description:
    "Generate laboratory reports with your custom laboratory template."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
