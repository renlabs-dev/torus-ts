import * as React from 'react';

export function Container({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="mx-auto mt-20 w-full max-w-screen-xl px-4 md:mt-24">
        {children}
      </div>
    </main>
  );
}
