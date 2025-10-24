import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, X } from "lucide-react"

interface PhotoFiltersProps {
  filters: {
    jobId?: string
    type?: 'before' | 'after' | 'all'
    dateRange?: { start: string; end: string }
    searchTerm?: string
  }
  onFiltersChange: (filters: any) => void
  jobs: Array<{ id: string; title: string }>
}

export default function PhotoFilters({ filters, onFiltersChange, jobs }: PhotoFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof typeof filters] !== undefined && 
    filters[key as keyof typeof filters] !== '' &&
    filters[key as keyof typeof filters] !== 'all'
  )

  return (
    <div className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-400">
          <Filter className="w-5 h-5" />
          <h3 className="font-medium">Filter Photos</h3>
        </div>
        
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search
          </label>
          <Input
            placeholder="Search photos..."
            value={filters.searchTerm || ''}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="bg-gray-800/50 border-gray-600 text-white"
          />
        </div>

        {/* Job Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Job
          </label>
          <Select value={filters.jobId || 'all'} onValueChange={(value) => updateFilter('jobId', value === 'all' ? undefined : value)}>
            <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Photo Type
          </label>
          <Select value={filters.type || 'all'} onValueChange={(value) => updateFilter('type', value === 'all' ? undefined : value)}>
            <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="before">Before</SelectItem>
              <SelectItem value="after">After</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date Range
          </label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => updateFilter('dateRange', { 
                ...filters.dateRange, 
                start: e.target.value 
              })}
              className="bg-gray-800/50 border-gray-600 text-white text-xs"
            />
            <Input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => updateFilter('dateRange', { 
                ...filters.dateRange, 
                end: e.target.value 
              })}
              className="bg-gray-800/50 border-gray-600 text-white text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}