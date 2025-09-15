import "./globals.css";

export const metadata = {
  title: "Калькулятор экономии топлива ВШК Альянс-Импорт",
  description:
    "Рассчитайте экономию топлива с грузовыми шинами Annaite, Aufine, Kapsen и Pegasus.",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" }, // 👈 SVG favicon
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZJZ5GP6EQN"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZJZ5GP6EQN');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}


