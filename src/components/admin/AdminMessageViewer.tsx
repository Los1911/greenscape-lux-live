import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Search, 
  User, 
  Wrench, 
  AlertTriangle,
  Eye,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Shield,
  Flag,
  ExternalLink,
  Bell,
  BellOff,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LANDSCAPER_MESSAGE_TYPES, CLIENT_MESSAGE_TYPES } from '@/components/messaging/StructuredJobMessaging';
import { MessageNotificationBadge, MessageNotificationDot } from '@/components/messaging/MessageNotificationBadge';

interface MessageWithJob {
  id: string;
  job_id: string;
  sender_id: string;
  sender_role: 'client' | 'landscaper';
  message_type: string;
  message: string;
  photo_url?: string | null;
  created_at: string;
  is_blocked?: boolean;
  job?: {
    id: string;
    service_name: string;
    status: string;
    customer_name?: string;
  };
}

interface JobThread {
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  customerName: string;
  messages: MessageWithJob[];
  hasBlockedContent: boolean;
  lastMessageAt: string;
  unreadCount: number;
  hasNewMessages: boolean;
}

export function AdminMessageViewer() {
  const [threads, setThreads] = useState<JobThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBlocked, setFilterBlocked] = useState<boolean>(false);
  const [filterUnread, setFilterUnread] = useState<boolean>(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [lastViewedTimes, setLastViewedTimes] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchAllMessages();
    loadLastViewedTimes();
  }, []);

  // Load last viewed times from localStorage
  const loadLastViewedTimes = () => {
    try {
      const stored = localStorage.getItem('admin_message_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        setLastViewedTimes(new Map(Object.entries(parsed)));
      }
    } catch (error) {
      console.error('Error loading last viewed times:', error);
    }
  };

  // Save last viewed time for a thread
  const markThreadAsViewed = (jobId: string) => {
    const now = new Date().toISOString();
    setLastViewedTimes(prev => {
      const next = new Map(prev);
      next.set(jobId, now);
      // Save to localStorage
      const obj: Record<string, string> = {};
      next.forEach((v, k) => obj[k] = v);
      localStorage.setItem('admin_message_last_viewed', JSON.stringify(obj));
      return next;
    });

    // Update thread state
    setThreads(prev => prev.map(t => 
      t.jobId === jobId 
        ? { ...t, hasNewMessages: false, unreadCount: 0 }
        : t
    ));
  };

  const fetchAllMessages = async () => {
    setLoading(true);
    try {
      // Fetch all messages with job info
      const { data: messages, error } = await supabase
        .from('job_messages')
        .select(`
          *,
          job:jobs(id, service_name, status, customer_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stored last viewed times
      let storedTimes = new Map<string, string>();
      try {
        const stored = localStorage.getItem('admin_message_last_viewed');
        if (stored) {
          const parsed = JSON.parse(stored);
          storedTimes = new Map(Object.entries(parsed));
        }
      } catch {}

      // Group messages by job
      const threadMap = new Map<string, JobThread>();
      
      (messages || []).forEach((msg: MessageWithJob) => {
        const jobId = msg.job_id;
        
        if (!threadMap.has(jobId)) {
          threadMap.set(jobId, {
            jobId,
            jobTitle: msg.job?.service_name || 'Unknown Job',
            jobStatus: msg.job?.status || 'unknown',
            customerName: msg.job?.customer_name || 'Unknown Customer',
            messages: [],
            hasBlockedContent: false,
            lastMessageAt: msg.created_at,
            unreadCount: 0,
            hasNewMessages: false,
          });
        }
        
        const thread = threadMap.get(jobId)!;
        thread.messages.push(msg);
        
        if (msg.is_blocked) {
          thread.hasBlockedContent = true;
        }
        
        if (new Date(msg.created_at) > new Date(thread.lastMessageAt)) {
          thread.lastMessageAt = msg.created_at;
        }

        // Check if message is unread (after last viewed time)
        const lastViewed = storedTimes.get(jobId);
        if (!lastViewed || new Date(msg.created_at) > new Date(lastViewed)) {
          thread.unreadCount += 1;
          thread.hasNewMessages = true;
        }
      });

      // Sort messages within each thread by date ascending
      threadMap.forEach(thread => {
        thread.messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      // Convert to array and sort by last message date
      const threadArray = Array.from(threadMap.values()).sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      setThreads(threadArray);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = (jobId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
        // Mark as viewed when expanded
        markThreadAsViewed(jobId);
      }
      return next;
    });
  };

  const getMessageTypeLabel = (typeId: string) => {
    const allTypes = [...LANDSCAPER_MESSAGE_TYPES, ...CLIENT_MESSAGE_TYPES];
    return allTypes.find(t => t.id === typeId)?.label || typeId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30';
      case 'active': return 'bg-blue-900/30 text-blue-400 border-blue-500/30';

      case 'assigned': return 'bg-amber-900/30 text-amber-400 border-amber-500/30';
      case 'flagged_review': return 'bg-red-900/30 text-red-400 border-red-500/30';
      default: return 'bg-slate-800/50 text-slate-400 border-slate-600/30';
    }
  };

  // Calculate stats
  const totalUnread = threads.reduce((sum, t) => sum + (t.hasNewMessages ? 1 : 0), 0);
  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);
  const flaggedThreads = threads.filter(t => t.hasBlockedContent).length;
  const activeThreads = threads.filter(t => t.jobStatus === 'active').length;


  // Filter threads
  const filteredThreads = threads.filter(thread => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesJob = thread.jobTitle.toLowerCase().includes(query);
      const matchesCustomer = thread.customerName.toLowerCase().includes(query);
      const matchesMessage = thread.messages.some(m => 
        m.message.toLowerCase().includes(query)
      );
      if (!matchesJob && !matchesCustomer && !matchesMessage) return false;
    }

    // Status filter
    if (filterStatus !== 'all' && thread.jobStatus !== filterStatus) return false;

    // Blocked content filter
    if (filterBlocked && !thread.hasBlockedContent) return false;

    // Unread filter
    if (filterUnread && !thread.hasNewMessages) return false;

    return true;
  });

  return (
    <Card className="bg-slate-900/50 border-emerald-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-emerald-100 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Message Oversight Dashboard
              {totalUnread > 0 && (
                <MessageNotificationBadge count={totalUnread} size="md" />
              )}
            </CardTitle>
            <p className="text-sm text-emerald-200/60 mt-1">
              Review all job communications for disputes, ratings, and safety
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllMessages}
            className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search jobs, customers, or messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="active">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="flagged_review">Flagged</SelectItem>
            </SelectContent>

          </Select>

          <Button
            variant={filterUnread ? "default" : "outline"}
            onClick={() => setFilterUnread(!filterUnread)}
            className={filterUnread 
              ? "bg-blue-600 hover:bg-blue-500 text-white" 
              : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }
          >
            {filterUnread ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
            Unread Only
          </Button>

          <Button
            variant={filterBlocked ? "default" : "outline"}
            onClick={() => setFilterBlocked(!filterBlocked)}
            className={filterBlocked 
              ? "bg-amber-600 hover:bg-amber-500 text-white" 
              : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }
          >
            <Flag className="w-4 h-4 mr-2" />
            Flagged Only
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-emerald-400">{threads.length}</div>
            <div className="text-xs text-slate-400">Total Threads</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{totalMessages}</div>
            <div className="text-xs text-slate-400">Total Messages</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-400">{totalUnread}</div>
              {totalUnread > 0 && <MessageNotificationDot visible={true} size="sm" />}
            </div>
            <div className="text-xs text-slate-400">Unread Threads</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-amber-400">{flaggedThreads}</div>
            <div className="text-xs text-slate-400">Flagged Threads</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{activeThreads}</div>
            <div className="text-xs text-slate-400">Active Jobs</div>
          </div>
        </div>

        {/* Thread List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading messages...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No message threads found</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div 
                key={thread.jobId}
                className={`bg-slate-800/30 border rounded-lg overflow-hidden transition-all ${
                  thread.hasNewMessages 
                    ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' 
                    : 'border-slate-700/50'
                }`}
              >
                {/* Thread Header */}
                <button
                  onClick={() => toggleThread(thread.jobId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MessageCircle className={`w-5 h-5 ${thread.hasNewMessages ? 'text-blue-400' : 'text-emerald-400'}`} />
                      {thread.hasNewMessages && (
                        <MessageNotificationDot visible={true} size="sm" className="absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                        {thread.jobTitle}
                        {thread.hasNewMessages && (
                          <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-500/30 text-[10px]">
                            <Bell className="w-3 h-3 mr-1" />
                            {thread.unreadCount} new
                          </Badge>
                        )}
                        {thread.hasBlockedContent && (
                          <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-500/30 text-[10px]">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {thread.customerName} • {thread.messages.length} messages
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(thread.jobStatus)} border`}>
                      {thread.jobStatus.replace('_', ' ')}
                    </Badge>
                    <div className="text-xs text-slate-500 hidden sm:block">
                      {formatDate(thread.lastMessageAt)}
                    </div>
                    {expandedThreads.has(thread.jobId) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Messages */}
                {expandedThreads.has(thread.jobId) && (
                  <div className="border-t border-slate-700/50 p-4 space-y-3 bg-slate-900/30">
                    {thread.messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.is_blocked 
                            ? 'bg-amber-900/20 border border-amber-500/30' 
                            : 'bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${
                              msg.sender_role === 'landscaper' 
                                ? 'bg-blue-900/50' 
                                : 'bg-emerald-900/50'
                            }`}>
                              {msg.sender_role === 'landscaper' ? (
                                <Wrench className="w-3 h-3 text-blue-400" />
                              ) : (
                                <User className="w-3 h-3 text-emerald-400" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-white capitalize">
                              {msg.sender_role}
                            </span>
                            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                              {getMessageTypeLabel(msg.message_type)}
                            </Badge>
                            {msg.is_blocked && (
                              <Badge variant="outline" className="text-[10px] bg-amber-900/30 text-amber-400 border-amber-500/30">
                                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                                Filtered
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">
                          {msg.message}
                        </p>
                        
                        {msg.photo_url && (
                          <div className="mt-2">
                            <a 
                              href={msg.photo_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              <Eye className="w-3 h-3" />
                              View Attached Photo
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminMessageViewer;
