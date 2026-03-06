import { ClerkProvider, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className="antialiased bg-[#08080a] text-zinc-100">
          <header className="sticky top-0 z-50 flex justify-end gap-3 border-b border-white/[0.06] bg-[#0a0a0f]/80 px-4 py-3 backdrop-blur-xl">
            <SignInButton mode="modal">
              <button className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]">
                サインイン
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100">
                新規登録
              </button>
            </SignUpButton>
            <UserButton />
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}