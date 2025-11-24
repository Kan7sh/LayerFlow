"use client";
import Link from "next/link";
import Image from "next/image";
import LogoImage from "@/assets/logo.png";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import router from "next/router";
import { Spinner } from "./spinner";

export default function GlassNavBar() {
  const [isGooleLoginLoading, setIsGooleLoginLoading] = useState(false);
  const session = useSession();
  const scrollToAbout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (session.status === "loading") {
    return (
      <div className="h-screen w-screen flex items-center justify-center self-center">
        <Spinner />
      </div>
    );
  }

  async function logout() {
    await signOut();
  }

  const signinWithGoogle = async () => {
    console.log("okw");
    if (isGooleLoginLoading) return;
    console.log("inn");

    setIsGooleLoginLoading(true);

    const res = await signIn("google", { redirect: false });
    setIsGooleLoginLoading(false);

    if (res?.ok) {
      router.push("/");
    }
  };

  return (
    <nav className="fixed    w-full top-0 z-50 flex flex-col  items-center px-5">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-1">
          <Link href={"/"}>
            <Image
              src={LogoImage}
              alt="Logo Image"
              color=""
              width={40}
              height={46}
              className="m-2"
            />
          </Link>
          <div className="text-xl font-semibold text-white">Layer Flow</div>
        </div>
        <div className="hidden md:block">
          <div className="flex flex-row justify-center items-center gap-8">
            {session.status == "authenticated" && (
              <a
                href="#about"
                onClick={scrollToAbout}
                className="text-sm font-medium text-white"
              >
                Playground
              </a>
            )}
            <a
              href="#about"
              onClick={scrollToAbout}
              className="text-sm font-medium text-white"
            >
              About
            </a>
            {session.status == "authenticated" && (
              <div
                className="bg-neutral-900 text-xs  text-white font-medium rounded-lg px-3 py-2 cursor-pointer"
                onClick={logout}
              >
                Logout
              </div>
            )}
            {session.status == "unauthenticated" && (
              <div
                className="bg-neutral-900 text-xs  text-white font-medium rounded-lg px-3 py-2 flex gap-2 cursor-pointer"
                onClick={signinWithGoogle}
              >
                <FcGoogle className={`w-4 h-4`} />
                Login
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden"></div>
      </div>
    </nav>
  );
}
