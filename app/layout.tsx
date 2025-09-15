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
      <body>{children}</body>
    </html>
  );
}

