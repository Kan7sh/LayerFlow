"use client";
import Link from "next/link";
import Image from "next/image";
import LogoImage from "@/assets/logo.png";
import { useState } from "react";
// import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
// import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { signOut, useSession } from "next-auth/react";
// import { Separator } from "./ui/separator";
// import { Toggle } from "./ui/toggle";
// import { useTheme } from "@/store/context/ThemeContext";

export default function GlassNavBar() {
  const [isOpen, setIsOpen] = useState(false);
  //   const { theme, toggleTheme } = useTheme();
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  async function logout() {
    await signOut();
  }

  return (
    <nav className="fixed px-5 left-1/2 -translate-x-1/2 w-11/12 top-0 z-50 flex flex-col  items-center mt-7 bg-background/20 backdrop-blur-lg rounded-4xl  max-w-7xl">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Link href={"/"}>
            <Image
              src={LogoImage}
              alt="Logo Image"
              color=""
              width={55}
              height={55}
              className="m-2"
            />
          </Link>
          <div className="text-xl font-semibold text-white">Layer Flow</div>
        </div>
        <div className="hidden md:block">
          <div className="flex flex-row justify-center items-center gap-8">
            <a href="#about" onClick={scrollToAbout}>
              About
            </a>
            {/* <Toggle
              pressed={theme === "dark"}
              onPressedChange={toggleTheme}
              variant="outline"
              aria-label="Toggle dark mode"
              size="sm"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <MoonStar className="size-4" />
              )}
            </Toggle> */}
            {/* <Popover>
              <PopoverTrigger asChild>
                <Avatar className="w-15 h-15 border-2 border-white">
                  <AvatarImage src={session.data?.user.image ?? ""} />
                  <AvatarFallback className="text-lg">
                    {getInitials(session.data?.user.name ?? "")}
                  </AvatarFallback>
                </Avatar>
              </PopoverTrigger>
              <PopoverContent className="bg-[linear-gradient(to_bottom,_#141414,_#141414,_#141414,_#141414)] rounded-3xl  border-none">
                <div className="flex flex-col items-center">
                  <h4 className="leading-none font-medium">
                    Hello! {session.data?.user.name}
                  </h4>
                  <p className="text-muted-foreground text-sm mt-2">
                    {session.data?.user.email}
                  </p>
                </div>
                <div className="flex flex-col mt-4 gap-2">
                 
                </div>
              </PopoverContent>
            </Popover> */}
          </div>
        </div>

        <div className="md:hidden"></div>
      </div>
      {isOpen && (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-3 md:hidden">
          <Link href={"/editprofile"}> Edit Profile</Link>
          <div onClick={logout} className="text-red-700 cursor-pointer">
            Logout
          </div>
        </div>
      )}
    </nav>
  );
}
