import "./globals.css";
import { Provider } from "./provider";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "AI PDF Notes",
  description: "PDF annotation app with AI features",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Provider>{children}</Provider>
        <Toaster />
      </body>
    </html>
  );
}
