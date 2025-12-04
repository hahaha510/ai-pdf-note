import "./globals.css";
import { Provider } from "./provider";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { SyncManager } from "@/components/SyncManager";
const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "AI PDF Notes",
  description: "PDF annotation app with AI features",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <Provider>
          <SyncManager />
          {children}
        </Provider>
        <Toaster />
      </body>
    </html>
  );
}
