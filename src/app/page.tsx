"use client";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import DarkVeil from "@/components/background/DarkVeil";
import BlurText from "@/components/text/BlurEffect";
import GlassNavBar from "@/components/ui/GlassmorphNav";
import Image from "next/image";
import homeImage from "@/assets/homeImage.png";
import imageEditing from "@/assets/homeEditing.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const [showModal, setShowModal] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");

  const aspectPresets = [
    { name: "Landscape 16:9", width: 1280, height: 720 },
    { name: "Portrait 9:16", width: 720, height: 1280 },
    { name: "Square 1:1", width: 1024, height: 1024 },
    { name: "Landscape 4:3", width: 1200, height: 900 },
    { name: "Portrait 3:4", width: 900, height: 1200 },
    { name: "UltraWide 21:9", width: 1920, height: 820 },
  ];

  async function logout() {
    await signOut();
  }

  const signinWithGoogle = async () => {
    const res = await signIn("google", { redirect: false });
    if (res?.ok) {
      router.push("/");
    }
  };

  const handleStartPlayground = () => {
    setShowModal(false);
    router.push(`/playground?width=${width}&height=${height}`);
  };

  return (
    <div>
      <div className="relative h-screen w-full bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <DarkVeil colorStops={["#811f39", "#cf486c", "#b61b44"]} />
        </div>
        <GlassNavBar setShowModal={setShowModal} />

        <div className="relative z-10 flex flex-row justify-center items-center h-full  px-6 py-3">
          <div className=" flex-1  p-6 py-20">
            <div className="flex flex-col">
              <BlurText
                text="Your creative flow, supercharged by AI"
                delay={150}
                animateBy="words"
                className="text-6xl mb-8 font-bold text-white leading-tight"
                animationFrom={undefined}
                animationTo={undefined}
                onAnimationComplete={undefined}
              />
              <div className="text-gray-300 text-lg leading-relaxed">
                Transform your ideas into stunning visuals with AI-powered
                tools. Experience seamless creativity with intelligent design
                assistance, real-time collaboration, and limitless possibilities
                at your fingertips.
              </div>
              <div className="mt-4 inline-block">
                <div className="playground-glow-wrapper rounded-xl">
                  <Button
                    onClick={() => setShowModal(true)}
                    className="w-50 h-14 bg-[#1a004e] hover:bg-[#130037] relative z-10 overflow-hidden"
                  >
                    Playground
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="bg-[#0d0d0d] text-white border border-neutral-700 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Start a New Canvas
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Choose your canvas size or use a preset to jump right in.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {aspectPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setWidth(preset.width);
                        setHeight(preset.height);
                        setSelectedPreset(preset.name);
                      }}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        selectedPreset === preset.name
                          ? "bg-[#cf486c]/20 border-[#cf486c]"
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm">Width</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full bg-black border border-gray-700 rounded-md p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm">Height</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-black border border-gray-700 rounded-md p-2 mt-1"
                  />
                </div>

                <Button
                  onClick={handleStartPlayground}
                  className="w-full bg-[#b61b44] hover:bg-[#620720] text-white h-12 rounded-xl"
                >
                  Start Editing
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div
            className=" flex-1 h-[75vh]"
            style={{
              perspective: "700px",
              perspectiveOrigin: "center",
            }}
          >
            <div
              className="relative h-full transition-transform duration-500 hover:scale-105"
              style={{
                transform: "rotateY(-12deg) rotateX(5deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl  border-[#cf486c] opacity-70 blur-lg"
                style={{ transform: "translateZ(-10px)" }}
              ></div>
              <div
                className="absolute inset-0 rounded-3xl border-[#b61b44] animate-pulse"
                style={{ transform: "translateZ(-5px)" }}
              ></div>

              <div className="relative rounded-3xl overflow-hidden shadow-2xl w-full h-full">
                <Image
                  src={homeImage}
                  alt="AI Image"
                  fill
                  className="relative object-cover rounded-3xl"
                  style={{ transform: "translateZ(0px)" }}
                  priority
                />
              </div>

              {/* Shadow effect */}
            </div>
          </div>
        </div>
      </div>

      <section id="about" className="bg-black px-6 py-24">
        <div className="max-w-8xl mx-auto">
          <div className="bg-linear-to-b from-[#410817] via-[#cf486c]/60 to-[#390614] rounded-2xl p-15 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
                  What we build
                </h2>
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                  An open-source, layer-based image editor crafted for creators
                  and teams. Add, arrange and style multiple image and text
                  layers, tweak properties like opacity, blend mode, position
                  and transforms — all with a smooth, responsive UI. The editor
                  includes an AI Assistant (powered by LangChain) that helps you
                  generate images from prompts, remove backgrounds, create and
                  position text layers, and automate repetitive editing tasks.
                  Whether you're prototyping designs, cleaning photos, or
                  generating assets for web and social, our tool makes complex
                  editing simple and collaborative.
                </p>
                <p className="text-gray-400 text-sm">
                  Fully open-source — fork, extend, and contribute. Built for
                  extensibility and privacy-conscious collaboration.
                </p>
              </div>

              <div className="relative h-90 lg:h-96">
                <Image
                  src={imageEditing}
                  alt="about-illustration"
                  fill
                  className="object-contain rounded-2xl"
                />

                <div className="pointer-events-none">
                  <div className="absolute top-6 left-10 bg-[#0f1724]/70 text-white px-4 py-3 rounded-md text-sm shadow-md">
                    Layered Editing
                  </div>
                  <div className="absolute top-14 right-12 bg-[#0f1724]/70 text-white px-4 py-3 rounded-md text-sm shadow-md">
                    AI Assistant
                  </div>
                  <div className="absolute bottom-12 left-16 bg-[#0f1724]/70 text-white px-4 py-3 rounded-md text-sm shadow-md">
                    Background Removal
                  </div>
                  <div className="absolute bottom-20 right-6 bg-[#0f1724]/70 text-white px-4 py-3 rounded-md text-sm shadow-md">
                    Open Source
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
