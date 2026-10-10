import type { Metadata } from "next";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Reset hasła – Hallway" };

export default function ForgotPasswordPage() {
  return <Client />;
}
