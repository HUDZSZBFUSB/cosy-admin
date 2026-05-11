import "./globals.css";

export const metadata = {
  title: "Cosy Admin",
  description: "Dashboard interne Cosy Corner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var d=localStorage.getItem('theme');if(d==='dark'||(!d&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})()`
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
