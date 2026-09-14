import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex flex-col w-full">
      <Hero locale={locale} />
      <Features />
    </div>
  );
}