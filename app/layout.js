import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Campaign Back Office - Management System",
  description: "Political campaign management system with 2FA security",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
