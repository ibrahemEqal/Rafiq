import ReviewPage from "@/components/study/ReviewPage";
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <ReviewPage token={(await params).token} />;
}
