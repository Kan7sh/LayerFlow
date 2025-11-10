"use client";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

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
    <div className="h-screen w-screen flex justify-center items-center bg-gray-50">
      {!session && (
        <Button className="cursor-pointer" onClick={signinWithGoogle}>
          <FcGoogle className="w-6 h-6 mr-2" /> Login with Google
        </Button>
      )}

      {session && (
        <div className="flex flex-col gap-5">
          <Button onClick={() => setShowModal(true)}>Playground</Button>
          <Button onClick={logout}>Logout</Button>
        </div>
      )}

      {/* Modal for size selection */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[450px]">
            <h2 className="text-lg font-semibold mb-4">
              🖼️ Choose Canvas Size
            </h2>

            <div className="grid grid-cols-1 gap-3 mb-4">
              {aspectPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSelectedPreset(preset.name);
                    setWidth(preset.width);
                    setHeight(preset.height);
                  }}
                  className={`px-4 py-2 rounded border text-sm text-left ${
                    selectedPreset === preset.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {preset.name} ({preset.width}×{preset.height})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                placeholder="Width"
                value={width}
                onChange={(e) => {
                  setSelectedPreset("custom");
                  setWidth(Number(e.target.value));
                }}
                className="w-1/2 px-3 py-2 border rounded"
              />
              <span className="text-gray-600">×</span>
              <input
                type="number"
                placeholder="Height"
                value={height}
                onChange={(e) => {
                  setSelectedPreset("custom");
                  setHeight(Number(e.target.value));
                }}
                className="w-1/2 px-3 py-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartPlayground}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
