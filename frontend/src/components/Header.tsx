'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="flex justify-end items-center gap-4 p-4 border-b">
      {status === "loading" ? (
        <span className="text-sm text-gray-500">読み込み中...</span>
      ) : session?.user ? (
        <>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt="icon"
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span className="text-sm">{session.user.name}</span>
          <button
            onClick={() => signOut()}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            ログアウト
          </button>
        </>
      ) : (
        <button
          onClick={() => signIn("github")}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
        >
          GitHubでログイン
        </button>
      )}
    </header>
  );
}