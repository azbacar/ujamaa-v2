import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FREELANCE_CATEGORIES } from '@/hooks/useFreelance';

interface Props {
  category: string;
  onCategoryChange: (value: string) => void;
}

export default function FreelanceFilters({ category, onCategoryChange }: Props) {
  return (
    <div className="flex gap-3 items-center">
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Toutes les catégories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les catégories</SelectItem>
          {FREELANCE_CATEGORIES.map(c => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
