"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { signIn, signOut, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  async function logout() {
    await signOut();
  }

  const goToPlayground = () => {
    router.push("/playground");
  };

  const signinWithGoogle = async () => {
    const res = await signIn("google", { redirect: false });
    if (res?.ok) {
      router.push("/");
    }
  };
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      {!session && (
        <Button className="cursor-pointer" onClick={signinWithGoogle}>
          <FcGoogle className={`w-8 h-8 ${"visible"}`} /> Login with Google
        </Button>
      )}
      {session && (
        <div className="flex flex-col gap-5">
          <Button onClick={goToPlayground}>Playground</Button>
          <Button onClick={logout}>Logout</Button>
        </div>
      )}
    </div>
  );
}
