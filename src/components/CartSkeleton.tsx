import { Skeleton } from "./ui/skeleton"

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
          <Skeleton className="w-20 h-20 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </div>
      ))}
      
      <div className="space-y-3 pt-4 border-t">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex justify-between font-bold text-lg">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      
      <Skeleton className="w-full h-12 rounded-lg mt-4" />
    </div>
  )
}
