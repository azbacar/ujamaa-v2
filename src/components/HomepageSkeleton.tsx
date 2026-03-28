import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const HeroSkeleton = () => (
  <div className="rounded-2xl bg-muted/50 p-6 sm:p-8 space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-72" />
    <Skeleton className="h-10 w-full max-w-md" />
    <div className="flex gap-2 flex-wrap">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  </div>
);

export const StatsBarSkeleton = () => (
  <div className="flex gap-2 overflow-hidden">
    {[1, 2, 3, 4, 5].map(i => (
      <Skeleton key={i} className="h-16 w-32 rounded-xl flex-shrink-0" />
    ))}
  </div>
);

export const IslandsSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-32" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  </div>
);

export const AnnouncementsSkeleton = () => (
  <div className="space-y-3">
    <div className="flex justify-between">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const CategoriesSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-36" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const SidebarSkeleton = () => (
  <div className="space-y-5">
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton className="h-5 w-14 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);
