
import "./globals.css";
import { Provider } from './provider'
import { Outfit } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs";
const outfit = Outfit({ subsets: ['latin'] })

export const metadata = {
  title: "AI PDF Notes",
  description: "PDF annotation app with AI features",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={outfit.className}>
        <body>
          <Provider>
            {children}
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
