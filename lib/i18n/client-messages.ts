export type ClientNamespace =
  | "Resources"
  | "Books"
  | "Admin"
  | "Questions"
  | "Requests"
  | "Study"
  | "Companion"
  | "Circles";

export function pickClientMessages<
  T extends AbstractIntlMessages,
  K extends ClientNamespace,
>(messages: T, namespace: K): AbstractIntlMessages {
  if (!(namespace in messages))
    throw new Error(`Missing client message namespace: ${namespace}`);
  return { [namespace]: messages[namespace] };
}
import type { AbstractIntlMessages } from "next-intl";
