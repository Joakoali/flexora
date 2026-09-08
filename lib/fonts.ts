import { Anybody, Geist, Geist_Mono } from "next/font/google";

export const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  // Sin preload: el mono sólo pinta rótulos chicos, ninguno crítico para el
  // primer paint, y su <link rel=preload> de prioridad alta competía por ancho
  // de banda con el CSS render-blocking (Lighthouse: 700ms de bloqueo).
  preload: false,
});
