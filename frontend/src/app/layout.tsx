import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { FlowStatusBoard } from '@/components/FlowStatusBoard';

export const metadata: Metadata = {
  title: 'Basket Enhanced - POR-Backed Stablecoins',
  description: 'Create and manage POR-backed stablecoins with Chainlink integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex">
            <div className="flex-1">
              <Header />
              <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
              </main>
            </div>
            <FlowStatusBoard />
          </div>
        </Providers>
      </body>
    </html>
  );
}
