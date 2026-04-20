import type { Metadata } from "next"
import { Geist_Mono, Roboto } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import Footer from "@/components/footer"
import Header from "@/components/header"
const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})
export const metadata: Metadata = {
  title: "Campeonato Uruguayo",
  description: "Statistics and data for the Uruguayan Primera División",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}
const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        roboto.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <Header />
            {children}
            <Footer />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
export default RootLayout
