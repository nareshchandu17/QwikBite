import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
    </div>
  );
}
