import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Agency Client Portal",
  description: "Manage your agency projects and clients",
};

export default async function RootLayout({ children }) {
  const { userId } = await auth();
  
  // If user is on root path and logged in, redirect to dashboard
  // This handles the case after login redirect
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}