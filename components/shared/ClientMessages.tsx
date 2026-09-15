import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickClientMessages, type ClientNamespace } from "@/lib/i18n/client-messages";

// One provider per interactive section, never one dictionary per card.
export default async function ClientMessages({ namespace, children }: {
  namespace: ClientNamespace;
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return <NextIntlClientProvider messages={pickClientMessages(messages, namespace)}>{children}</NextIntlClientProvider>;
}
