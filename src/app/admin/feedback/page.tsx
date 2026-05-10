"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Feedback {
  _id: string;
  feedbackId: string; // Add feedbackId field
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  rating: number;
  comment: string;
  isAnonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  category?: string;
  quickRating?: string;
  reportIssue?: string[];
}

export default function AdminFeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    actionsTaken: 258
  });

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      console.log('Fetching feedbacks from /api/feedbacks...');
      const res = await fetch('/api/feedbacks');
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Response data:', data);
        if (data.success) {
          setFeedbacks(data.data || []);
          calculateStats(data.data || []);
        } else {
          console.error('API returned error:', data.error);
          toast.error(`Failed: ${data.error}`);
        }
      } else {
        const errorText = await res.text();
        console.error('HTTP error:', res.status, errorText);
        toast.error(`HTTP ${res.status}: Failed to load feedbacks`);
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Network error loading feedbacks');
    }
  };

  const calculateStats = (feedbackList: Feedback[]) => {
    const total = feedbackList.length;
    const totalRating = feedbackList.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = total > 0 ? (totalRating / total).toFixed(1) : '0';
    
    const positive = feedbackList.filter(f => f.rating >= 4).length;
    const neutral = feedbackList.filter(f => f.rating === 3).length;
    const negative = feedbackList.filter(f => f.rating <= 2).length;

    setStats({
      total,
      averageRating: parseFloat(averageRating),
      positive,
      neutral,
      negative,
      actionsTaken: 258
    });
  };

  const getSentiment = (rating: number) => {
    if (rating >= 4) return { label: 'Positive', color: 'emerald' };
    if (rating === 3) return { label: 'Neutral', color: 'amber' };
    return { label: 'Negative', color: 'red' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`material-icons-outlined text-sm ${i < rating ? 'text-primary' : 'text-slate-700'}`}>
        star
      </span>
    ));
  };

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  const getAvatarColor = (name: string) => {
    const colors = ['indigo', 'emerald', 'blue', 'purple', 'pink', 'yellow'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const handleReply = (feedbackId: string) => {
    setReplyingTo(feedbackId);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !replyingTo) return;

    try {
      // Find the feedback to get its feedbackId
      const feedback = feedbacks.find(f => f._id === replyingTo);
      if (!feedback || !feedback.feedbackId) {
        toast.error('Feedback ID not found');
        return;
      }

      const res = await fetch('/api/feedbacks/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: feedback.feedbackId, // Use feedbackId instead of _id
          reply: replyText,
        }),
      });

      if (res.ok) {
        toast.success('Reply sent successfully');
        setReplyingTo(null);
        setReplyText('');
        fetchFeedbacks(); // Refresh the feedback list
      } else {
        toast.error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Error sending reply');
    }
  };

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailsModal(true);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-white min-h-screen p-8 relative">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-6">
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="orange-line-gradient absolute top-0 left-0"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Feedback List</h3>
              <button className="flex items-center gap-1 text-sm text-white hover:text-primary transition-colors">
                Events <span className="material-icons-outlined text-sm">chevron_right</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {feedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-icons-outlined text-4xl text-white mb-4">chat_bubble_outline</span>
                  <p className="text-white">No feedback submissions yet</p>
                </div>
              ) : (
                feedbacks.map((feedback) => {
                  const sentiment = getSentiment(feedback.rating);
                  const avatarColor = getAvatarColor(feedback.user?.name || 'Anonymous');
                  
                  return (
                    <div key={feedback._id} className="dark:bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-full bg-${avatarColor}-500/20 text-${avatarColor}-400 flex items-center justify-center font-bold`}>
                            {getInitial(feedback.isAnonymous ? 'Anonymous' : (feedback.user?.name || 'User'))}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">
                              {feedback.isAnonymous ? 'Anonymous' : (feedback.user?.name || 'Unknown User')}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-white">{formatDate(feedback.createdAt)}</span>
                              <span className="w-1 h-1 bg-white rounded-full"></span>
                              <span className="text-xs text-white">Order #{feedback._id.slice(-6)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {renderStars(feedback.rating)}
                        </div>
                      </div>
                      
                      <p className="text-white mb-6 italic leading-relaxed">
                        &quot;{feedback.comment}&quot;
                      </p>
                      
                      {feedback.images && feedback.images.length > 0 && (
                        <div className="mb-4 flex gap-2">
                          {feedback.images.map((image, idx) => (
                            <img key={idx} src={image} alt="Feedback image" className="h-16 w-16 rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 bg-${sentiment.color}-500/10 text-${sentiment.color}-500 text-xs font-semibold rounded-full border border-${sentiment.color}-500/20`}>
                          {sentiment.label}
                        </span>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleReply(feedback._id)}
                            className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-primary border border-primary/20 transition-all cursor-pointer"
                          >
                            Reply
                          </button>
                          <button 
                            onClick={() => handleViewDetails(feedback)}
                            className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            View Details <span className="material-icons-outlined text-sm">chevron_right</span>
                          </button>
                        </div>
                      </div>
                      
                      {feedback.adminComment && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-400 mb-1">Admin Reply:</p>
                            <p className="text-sm text-slate-300">{feedback.adminComment}</p>
                          </div>
                        </div>
                      )}
                      
                      {replyingTo === feedback._id && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                            <p className="text-xs font-semibold text-primary mb-2">Reply to Feedback:</p>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-primary/50 resize-none"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="px-4 py-2 text-xs font-semibold text-white hover:text-primary transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSendReply}
                                disabled={!replyText.trim()}
                                className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
              <span className="material-icons-outlined text-amber-400 text-3xl">lightbulb</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold dark:text-white">{stats.actionsTaken}</span>
                <span className="text-sm text-slate-500 font-medium">actions taken</span>
              </div>
              <p className="text-xs text-slate-500">last 30 days</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-6 tracking-wide uppercase">Feedback Summary</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((stars) => {
                const count = feedbacks.filter(f => f.rating === stars).length;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const opacity = 0.4 + (stars * 0.15);
                
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-primary w-12">
                      <span className="material-icons-outlined text-xs">star</span>
                      <span className="text-xs">{stars}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ 
                          width: `${percentage}%`, 
                          opacity: opacity 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{isNaN(percentage) ? '0.0' : percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
              
              <div className="flex items-center gap-3 pt-2">
                <span className="text-2xl font-bold text-primary w-12">{isNaN(stats.averageRating) ? '0.0' : stats.averageRating.toFixed(1)}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary glow-orange" style={{ width: `${(isNaN(stats.averageRating) ? 0 : (stats.averageRating / 5) * 100)}%` }}></div>
                </div>
                <span className="text-xs font-bold text-white w-12 text-right">{isNaN(stats.averageRating) ? '0.0' : ((stats.averageRating / 5) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 tracking-wide uppercase">Feedback Trends</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold text-emerald-500">
                {stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%
              </span>
              <span className="text-sm text-slate-300">Positive</span>
            </div>
            <div className="relative h-24 mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <path d="M0 35 Q 20 32, 30 38 T 50 30 T 70 25 T 90 10 T 100 5" fill="none" stroke="url(#lineGradient)" strokeWidth="2"></path>
                <circle className="animate-pulse" cx="100" cy="5" fill="#F97316" r="1.5"></circle>
                <defs>
                  <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.2"></stop>
                    <stop offset="100%" stopColor="#F97316" stopOpacity="1"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid grid-cols-6 gap-0 opacity-10 pointer-events-none">
                <div className="border-l border-white h-full"></div>
                <div className="border-l border-white h-full"></div>
                <div className="border-l border-white h-full"></div>
                <div className="border-l border-white h-full"></div>
                <div className="border-l border-white h-full"></div>
                <div className="border-l border-white h-full"></div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 font-medium">
              <span>1.0</span>
              <span>2.8</span>
              <span>2.4</span>
              <span>4.6</span>
              <span>5.4</span>
              <span>5.6</span>
              <span>7.4</span>
              <span>3.6</span>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-slate-500">
              <span className="material-icons-outlined text-[14px]">verified_user</span>
              All feedback data is securely stored
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold dark:text-white">Feedback Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-${getAvatarColor(selectedFeedback.user?.name || 'Anonymous')}-500/20 text-${getAvatarColor(selectedFeedback.user?.name || 'Anonymous')}-400 flex items-center justify-center font-bold text-lg`}>
                  {getInitial(selectedFeedback.isAnonymous ? 'Anonymous' : (selectedFeedback.user?.name || 'User'))}
                </div>
                <div>
                  <h4 className="font-medium dark:text-white">
                    {selectedFeedback.isAnonymous ? 'Anonymous' : (selectedFeedback.user?.name || 'Unknown User')}
                  </h4>
                  <p className="text-sm text-slate-500">{selectedFeedback.user?.email}</p>
                  <p className="text-xs text-slate-500">{formatDate(selectedFeedback.createdAt)}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">Rating:</span>
                <div className="flex gap-0.5">
                  {renderStars(selectedFeedback.rating)}
                </div>
                <span className="text-sm text-slate-300">({selectedFeedback.rating}/5)</span>
              </div>

              {/* Sentiment */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">Sentiment:</span>
                <span className={`px-3 py-1 bg-${getSentiment(selectedFeedback.rating).color}-500/10 text-${getSentiment(selectedFeedback.rating).color}-500 text-xs font-semibold rounded-full border border-${getSentiment(selectedFeedback.rating).color}-500/20`}>
                  {getSentiment(selectedFeedback.rating).label}
                </span>
              </div>

              {/* Feedback Text */}
              <div>
                <h5 className="text-sm font-medium text-slate-400 mb-2">Feedback:</h5>
                <p className="text-slate-300 italic leading-relaxed">&quot;{selectedFeedback.comment}&quot;</p>
              </div>

              {/* Additional Fields */}
              {selectedFeedback.category && (
                <div>
                  <h5 className="text-sm font-medium text-slate-400 mb-2">Category:</h5>
                  <p className="text-slate-300">{selectedFeedback.category}</p>
                </div>
              )}

              {selectedFeedback.quickRating && (
                <div>
                  <h5 className="text-sm font-medium text-slate-400 mb-2">Quick Rating:</h5>
                  <p className="text-slate-300">{selectedFeedback.quickRating}</p>
                </div>
              )}

              {selectedFeedback.reportIssue && selectedFeedback.reportIssue.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-400 mb-2">Reported Issues:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.reportIssue.map((issue: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded-full border border-red-500/20">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {selectedFeedback.images && selectedFeedback.images.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-400 mb-2">Attached Images:</h5>
                  <div className="flex gap-2 flex-wrap">
                    {selectedFeedback.images.map((image, idx) => (
                      <img key={idx} src={image} alt="Feedback image" className="h-24 w-24 rounded-lg object-cover border border-white/10" />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Reply */}
              {selectedFeedback.adminComment && (
                <div>
                  <h5 className="text-sm font-medium text-slate-400 mb-2">Admin Reply:</h5>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-slate-300">{selectedFeedback.adminComment}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleReply(selectedFeedback._id);
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Reply
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-semibold bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
