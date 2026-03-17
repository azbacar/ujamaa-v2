import { Star } from 'lucide-react';
import { FreelanceReview } from '@/hooks/useFreelance';

interface Props {
  review: FreelanceReview;
}

export default function FreelanceReviewCard({ review }: Props) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{review.reviewer_username}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-muted-foreground">{review.comment}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {new Date(review.created_at).toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
