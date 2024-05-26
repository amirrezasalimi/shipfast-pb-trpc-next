import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";

import { TRPCReactProvider } from "~/shared/utils/trpc/react";
import { Toaster } from "react-hot-toast";
import { NextUIProvider } from "@nextui-org/react";

export const metadata = {
  title: "Shipfast Boilerplate",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <NextUIProvider>{children}</NextUIProvider>
        </TRPCReactProvider>
        <Toaster position="bottom-center" reverseOrder={false} />
      </body>
    </html>
  );
}
