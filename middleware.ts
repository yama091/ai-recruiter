import { clerkMiddleware } from "@clerk/nextjs/server";

// API へのアクセスは常に許可し、404 / 認可エラーが出ないようにする
export default clerkMiddleware();

export const config = {
  matcher: [
    // 静的ファイルやNext.js内部動作を除外して、トップページを見れるようにする
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

