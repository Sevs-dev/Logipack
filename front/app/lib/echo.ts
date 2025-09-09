// // app/lib/echo.ts
// import Echo from "laravel-echo";
// import Pusher from "pusher-js";

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
// const REVERB_KEY = process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "app-key";
// const REVERB_HOST = process.env.NEXT_PUBLIC_REVERB_HOST ?? "127.0.0.1";
// const REVERB_PORT = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080);
// const REVERB_SCHEME = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";

// declare global {
//   interface Window {
//     Echo?: Echo;
//     Pusher?: typeof Pusher;
//   }
// }

// export function getEcho(): Echo | null {
//   if (typeof window === "undefined") return null;
//   if (window.Echo) return window.Echo;

//   // ✅ sin 'as any': tipamos Window.Pusher
//   window.Pusher = Pusher;

//   window.Echo = new Echo({
//     broadcaster: "pusher",
//     key: REVERB_KEY,
//     wsHost: REVERB_HOST,
//     wsPort: REVERB_PORT,
//     wssPort: REVERB_PORT,
//     forceTLS: REVERB_SCHEME === "https",
//     enabledTransports: ["ws", "wss"],

//     // Auth hacia Laravel (usa cookies con JWT)
//     authEndpoint: `${API_BASE}/api/broadcasting/auth`,
//     withCredentials: true,
//   });

//   return window.Echo;
// }
