import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#051A15',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'کافه دال | Dall Café - جایی برای مکث',
  description: 'منوی آنلاین و وب‌سایت رسمی کافه دال (Dall Café) - جایی برای مکث. تجربه آرامش، قهوه تخصصی و گفتگو در فضایی مینیمال.',
  applicationName: 'کافه دال',
  icons: {
    icon: '/dal-logo.svg',
    apple: '/dall.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'کافه دال',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'کافه دال | Dall Café - جایی برای مکث',
    description: 'منوی آنلاین و وب‌سایت رسمی کافه دال (Dall Café) - جایی برای مکث. تجربه آرامش، قهوه تخصصی و گفتگو.',
    type: 'website',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کافه دال | Dall Café - جایی برای مکث',
    description: 'منوی آنلاین و وب‌سایت رسمی کافه دال (Dall Café) - جایی برای مکث.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(typeof window!=='undefined'){let _f=window.fetch;Object.defineProperty(window,'fetch',{get:()=>_f,set:(v)=>{_f=v;},configurable:true,enumerable:true});}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
