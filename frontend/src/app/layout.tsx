import "./globals.css";
import Header from "@/components/Header";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Tech Doc Assistant",
  description: "AI-powered Technical Documentation Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
