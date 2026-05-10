import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FeedbackItem } from '@/types/feedback';

interface FeedbackCardProps {
  feedback: FeedbackItem;
  onReply: (id: string, reply: string) => Promise<void>;
}

export function FeedbackCard({ feedback, onReply }: FeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFeedbackType = (rating: number) => {
    if (rating >= 4) return { label: 'Positive', color: 'bg-green-500/20 text-green-400' };
    if (rating >= 2) return { label: 'Neutral', color: 'bg-yellow-500/20 text-yellow-400' };
    return { label: 'Negative', color: 'bg-red-500/20 text-red-400' };
  };

  const feedbackType = getFeedbackType(feedback.starRating);
  const hasReply = !!feedback.adminReply;

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      console.log('[FeedbackCard] Submitting reply for feedback:', feedback._id);
      await onReply(feedback._id, replyText);
      console.log('[FeedbackCard] ✅ Reply submitted successfully');
      setReplyText('');
      setIsExpanded(false);
    } catch (error) {
      console.error('[FeedbackCard] ❌ Error submitting reply:', error);
      // Error toast is handled in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-gray-800 transition-all duration-300 hover:border-white/20 flex-1 flex flex-col">
        {/* Header Section with user info and rating */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
              {feedback.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-white">{feedback.name}</h3>
              <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <span>{formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}</span>
                {feedback.orderReference && (
                  <span className="bg-white/5 px-2 py-0.5 rounded-full">
                    Order #{feedback.orderReference}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Star rating in top right */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < feedback.starRating ? 'text-amber-500' : 'text-white/20'}>
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Feedback message in the middle */}
        <div className="flex-grow my-4 text-sm text-[#9ca3af]">
          {feedback.feedbackText}
        </div>

        {/* Footer with actions */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className={`text-xs px-2 py-0.5 rounded-full ${feedbackType.color}`}>
              {feedbackType.label}
            </span>
            
            <div className="flex items-center gap-3">
              {!hasReply && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs font-medium text-[#FF512F] hover:text-white transition-colors"
                >
                  {isExpanded ? 'Cancel' : 'Respond'}
                </button>
              )}
              <button
                onClick={() => setShowDetails(true)}
                className="text-xs font-medium text-[#9ca3af] hover:text-white transition-colors"
              >
                View Details
              </button>
            </div>
          </div>

          {/* Reply Form */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF512F]/50 focus:border-transparent"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#9ca3af] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={isSubmitting || !replyText.trim()}
                  className="px-3 py-1.5 text-xs font-medium bg-[#FF512F] text-white rounded-lg hover:bg-[#FF512F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-white">Feedback Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-[#9ca3af] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl">
                    {feedback.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{feedback.name}</h3>
                    <p className="text-sm text-[#9ca3af]">
                      {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-[#9ca3af]">Student ID</p>
                    <p className="text-white">{feedback.studentId}</p>
                  </div>
                  {feedback.orderReference && (
                    <div className="space-y-1">
                      <p className="text-[#9ca3af]">Order Reference</p>
                      <p className="text-white">#{feedback.orderReference}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[#9ca3af]">Category</p>
                    <p className="text-white capitalize">{feedback.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#9ca3af]">Date</p>
                    <p className="text-white">
                      {new Date(feedback.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[#9ca3af]">Rating</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < feedback.starRating ? 'text-amber-500 text-xl' : 'text-white/20 text-xl'}>
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-[#9ca3af]">
                      {feedback.starRating}/5
                    </span>
                  </div>
                </div>

                {feedback.reportIssue.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-neutral-400">Issues Reported</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.reportIssue.map((issue: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[#9ca3af]">Feedback</p>
                  <div className="bg-white/5 p-4 rounded-lg text-white">
                    {feedback.feedbackText}
                  </div>
                </div>

                {feedback.adminReply && (
                  <div className="space-y-2">
                    <p className="text-[#9ca3af]">Your Reply</p>
                    <div className="bg-[#FF512F]/10 border border-[#FF512F]/20 p-4 rounded-lg">
                      <p className="text-white">{feedback.adminReply}</p>
                      <p className="text-xs text-[#FF512F]/80 mt-1">
                        Replied on {new Date(feedback.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    
    </div>
  );
}

export default FeedbackCard;
