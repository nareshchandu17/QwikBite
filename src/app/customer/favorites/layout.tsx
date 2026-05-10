import { ReactNode } from 'react';

export default function FavoritesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
      {children}
    </div>
  );
}
