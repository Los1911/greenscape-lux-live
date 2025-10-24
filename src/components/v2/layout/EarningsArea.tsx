import { Stat } from "@/components/v2/Stat";

export default function EarningsArea() {
  return (
    <div className="h-full space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-green-300">Earnings Trend</h2>
        </div>
        <span className="text-xs text-green-300/70">Last 30 days</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-black/40 border border-green-500/25 rounded-lg p-3 sm:p-4">
          <Stat label="All time Earnings" value="$0.00" />
        </div>
        <div className="bg-black/40 border border-green-500/25 rounded-lg p-3 sm:p-4">
          <Stat label="Jobs Completed" value="0" />
        </div>
        <div className="bg-black/40 border border-green-500/25 rounded-lg p-3 sm:p-4">
          <Stat label="Completion Rate" value="0.0%" />
        </div>
      </div>
      
      <div className="h-32 sm:h-48 rounded-xl border border-green-500/20 bg-black/40 flex items-center justify-center">
        <span className="text-green-300/50 text-sm">Chart placeholder</span>
      </div>
    </div>
  );
}