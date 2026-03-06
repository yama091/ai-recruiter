import { ClerkProvider, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className="antialiased">
          <header className="flex justify-end p-4 gap-4 bg-slate-900 border-b border-slate-800">
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition">
                サインイン
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-medium text-white border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-md transition">
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