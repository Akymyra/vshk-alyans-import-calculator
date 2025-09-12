import "./globals.css";

export const metadata = {
  title: "Калькулятор экономии топлива ВШК Альянс-Импорт",
  description: "Рассчитайте экономию топлива с грузовыми шинами Annaite, Aufine, Kapsen и Pegasus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
