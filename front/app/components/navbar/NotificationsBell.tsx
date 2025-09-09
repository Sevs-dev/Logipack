// "use client";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Bell } from "lucide-react";
// import { getEcho } from "@/app/lib/echo";

// type NotificationItem = {
//   id: string;
//   data: { title: string; body: string; link?: string };
//   read_at: string | null;
//   created_at?: string;
// };

// type BroadcastNotificationPayload = {
//   id: string;
//   title: string;
//   body: string;
//   link?: string | null;
//   time: string; // ISO 8601
// };

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// /* ===================== Type Guards ===================== */

// function isRecord(v: unknown): v is Record<string, unknown> {
//   return typeof v === "object" && v !== null;
// }

// function isBroadcastNotificationPayload(v: unknown): v is BroadcastNotificationPayload {
//   if (!isRecord(v)) return false;
//   const id = v["id"];
//   const title = v["title"];
//   const body = v["body"];
//   const link = v["link"];
//   const time = v["time"];
//   return (
//     typeof id === "string" &&
//     typeof title === "string" &&
//     typeof body === "string" &&
//     (typeof link === "string" || typeof link === "undefined" || link === null) &&
//     typeof time === "string"
//   );
// }

// function isNotificationItem(v: unknown): v is NotificationItem {
//   if (!isRecord(v)) return false;

//   const id = v["id"];
//   const data = v["data"];
//   const read_at = v["read_at"];
//   const created_at = v["created_at"];

//   if (typeof id !== "string") return false;
//   if (!isRecord(data)) return false;

//   const title = data["title"];
//   const body = data["body"];
//   const link = data["link"];

//   if (typeof title !== "string" || typeof body !== "string") return false;
//   if (!(typeof read_at === "string" || read_at === null)) return false;
//   if (!(typeof link === "string" || typeof link === "undefined")) return false;
//   if (!(typeof created_at === "undefined" || typeof created_at === "string")) return false;

//   return true;
// }

// function isNotificationArray(v: unknown): v is NotificationItem[] {
//   return Array.isArray(v) && v.every(isNotificationItem);
// }

// /* ===================== Component ===================== */

// export default function NotificationsBell({ userId }: { userId: number }) {
//   const [open, setOpen] = useState(false);
//   const [items, setItems] = useState<NotificationItem[]>([]);
//   const unread = useMemo(() => items.filter((i) => !i.read_at).length, [items]);
//   const audioRef = useRef<HTMLAudioElement | null>(null);

//   // Fetch inicial (Laravel)
//   useEffect(() => {
//     const ac = new AbortController();
//     (async () => {
//       try {
//         const res = await fetch(`${API_BASE}/api/notifications`, {
//           credentials: "include",
//           signal: ac.signal,
//         });
//         if (!res.ok) throw new Error(`GET /api/notifications -> ${res.status}`);
//         const ct = res.headers.get("content-type") ?? "";
//         if (!ct.includes("application/json")) throw new Error("Respuesta no JSON");
//         const data: unknown = await res.json();
//         if (!isNotificationArray(data)) throw new Error("Estructura inválida de notificaciones");
//         setItems(data);
//       } catch (err) {
//         if (!(err instanceof DOMException && err.name === "AbortError")) {
//           console.error("Error cargando notificaciones:", err);
//         }
//       }
//     })();
//     return () => ac.abort();
//   }, []);

//   // Suscripción tiempo real
//   useEffect(() => {
//     const Echo = getEcho();
//     if (!Echo || !Number.isFinite(userId) || userId <= 0) return;

//     const channel = Echo.private(`users.${userId}`);

//     channel.listen(".notifications.new", (raw: unknown) => {
//       if (!isBroadcastNotificationPayload(raw)) {
//         console.warn("Evento inválido en notifications.new:", raw);
//         return;
//       }

//       const n: NotificationItem = {
//         id: raw.id,
//         data: { title: raw.title, body: raw.body, link: raw.link ?? undefined },
//         read_at: null,
//         created_at: raw.time,
//       };

//       setItems((prev) => [n, ...prev]);

//       // Sonido discreto (si el navegador bloquea autoplay, no rompe)
//       try {
//         if (!audioRef.current) {
//           audioRef.current = new Audio("/sounds/notify.mp3");
//           audioRef.current.volume = 0.25;
//         }
//         audioRef.current.currentTime = 0;
//         void audioRef.current.play().catch(() => {});
//       } catch {
//         // ignorado
//       }
//     });

//     return () => {
//       channel.stopListening(".notifications.new");
//       Echo.leave(`users.${userId}`);
//     };
//   }, [userId]);

//   // Marcar como leídas
//   const markAllRead = async () => {
//     const ids = items.filter((i) => !i.read_at).map((i) => i.id);
//     if (!ids.length) return;
//     try {
//       const res = await fetch(`${API_BASE}/api/notifications/read`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ ids }),
//       });
//       if (!res.ok) throw new Error(`POST /api/notifications/read -> ${res.status}`);
//       setItems((prev) =>
//         prev.map((i) => (i.read_at ? i : { ...i, read_at: new Date().toISOString() }))
//       );
//     } catch (err) {
//       console.error("Error marcando notificaciones:", err);
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setOpen((v) => !v)}
//         className="relative p-2 rounded-lg hover:bg-surface/80 transition-colors"
//         aria-label="Notificaciones"
//       >
//         <Bell className="w-5 h-5 text-foreground/80" />
//         {unread > 0 && (
//           <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
//             {unread > 99 ? "99+" : unread}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-surface border border-border rounded-xl shadow-lg p-2 z-50">
//           <div className="flex items-center justify-between px-2 py-1">
//             <span className="text-sm font-semibold text-foreground">Notificaciones</span>
//             <button onClick={markAllRead} className="text-xs text-primary hover:underline">
//               Marcar todas como leídas
//             </button>
//           </div>
//           <ul className="divide-y divide-border/60">
//             {items.length === 0 ? (
//               <li className="text-sm text-foreground/60 p-3">Sin notificaciones</li>
//             ) : (
//               items.map((n) => (
//                 <li key={n.id} className="p-3 hover:bg-surface/60 rounded-lg">
//                   <div className="text-sm font-medium text-foreground">{n.data.title}</div>
//                   <div className="text-xs text-foreground/70">{n.data.body}</div>
//                   {n.data.link && (
//                     <a href={n.data.link} className="text-xs text-primary hover:underline">
//                       Ver más
//                     </a>
//                   )}
//                 </li>
//               ))
//             )}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }
