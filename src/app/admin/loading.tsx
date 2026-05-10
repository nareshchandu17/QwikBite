export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] p-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <div className="h-10 w-80 bg-gray-700 rounded-lg animate-pulse mb-2"></div>
          <div className="h-5 w-96 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-20 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-3 w-24 bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Table/List Skeleton */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
        <div className="p-6 border-b border-white/20">
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-32 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-6 w-20 bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
