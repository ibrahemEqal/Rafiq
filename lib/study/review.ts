import type { StudyCard, StudyReview } from "./validation.ts";
export type ReviewMode = "all" | "due" | "weak";

export function reviewQueue(cards: StudyCard[], reviews: StudyReview[], mode: ReviewMode, now: number) {
  const history = new Map(reviews.map(item => [item.card_id, item]));
  return cards.filter(card => {
    const review = history.get(card.id);
    if (mode === "weak") return review?.remembered === false;
    if (mode === "due") return !review || !Number.isFinite(Date.parse(review.next_review_at)) || Date.parse(review.next_review_at) <= now;
    return true;
  });
}
