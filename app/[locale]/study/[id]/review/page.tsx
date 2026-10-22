import ReviewPage from "@/components/study/ReviewPage";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ReviewPage id={(await params).id} />;
}
