// import { NextResponse } from "next/server";
// import type { Config } from "@imgly/background-removal";

// export const runtime: "nodejs" = "nodejs";
// export const maxDuration: number = 60;

// interface ErrorResponse {
//   error: string;
//   details: string;
//   stack?: string;
// }

// export async function POST(req: Request): Promise<Response> {
//   try {
//     console.log("🎯 Starting background removal...");

//     const formData: FormData = await req.formData();
//     const file: File | null = formData.get("image") as File | null;

//     if (!file) {
//       return NextResponse.json(
//         { error: "No image uploaded" } as ErrorResponse,
//         { status: 400 }
//       );
//     }

//     console.log(
//       `📁 File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`
//     );

//     const { removeBackground } = await import("@imgly/background-removal");
//     console.log("⚡ Processing with WASM...");

//     // ---- compute origin ----
//     const protoHeader = (req.headers.get("x-forwarded-proto") || "").split(
//       ","
//     )[0];
//     const protocol =
//       protoHeader || (req.headers.get("x-forwarded-proto") ? "https" : "http");
//     const host = req.headers.get("host") || "localhost:3000";
//     const origin = `${protocol}://${host}`;

//     // ---- self-hosted assets here ----
//     const publicPath = `${origin}/models/`; // where .wasm / .onnx are served from

//     const config: Partial<Config> = {
//       publicPath,
//       debug: true,
//     };

//     console.log("Using publicPath:", publicPath);

//     // optional sanity check – make sure at least ONE model file is reachable
//     const testUrl = publicPath + "isnet_fp16.onnx";
//     const testResp = await fetch(testUrl);
//     console.log(`GET ${testUrl} -> ${testResp.status}`);
//     if (!testResp.ok) {
//       return NextResponse.json(
//         {
//           error: "Resources not reachable",
//           details: `GET ${testUrl} returned ${testResp.status}`,
//         },
//         { status: 500 }
//       );
//     }

//     // ---- run background removal ----
//     const outputBlob: Blob = await removeBackground(file, config);
//     console.log("✅ Background removed successfully");

//     const arrayBuffer: ArrayBuffer = await outputBlob.arrayBuffer();

//     return new Response(arrayBuffer, {
//       headers: {
//         "Content-Type": "image/png",
//         "Content-Disposition": "inline; filename=removed-bg.png",
//         "Cache-Control": "no-cache",
//       },
//     });
//   } catch (error: unknown) {
//     const err = error as Error;
//     console.error("❌ Error removing background:", err);
//     console.error("Stack trace:", err.stack);

//     return NextResponse.json(
//       {
//         error: "Background removal failed",
//         details: err.message,
//         stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
//       } as ErrorResponse,
//       { status: 500 }
//     );
//   }
// }
