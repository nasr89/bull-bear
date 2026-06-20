import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: 'Bull & Bear Trading Community',
  description: 'Sales CRM for Bull & Bear Trading Community Lebanon',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
