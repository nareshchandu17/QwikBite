'use client';

import React, { useState, useEffect } from 'react';
import { Feedback, Sentiment } from '@/types/feedback';
import { StarIcon } from './icons';

const mockFeedback: Feedback[] = [
    { 
        id: 1, 
        customerName: 'Riya Sharma', 
        avatar: 'https://picsum.photos/id/1011/100', 
        rating: 5, 
        comment: 'The Veggie Burger was amazing! Super fresh and tasty. Quick service too!', 
        sentiment: 'Positive', 
        timestamp: '2 hours ago' 
    },
    { 
        id: 2, 
        customerName: 'Amit Singh', 
        avatar: 'https://picsum.photos/id/1012/100', 
        rating: 3, 
        comment: 'The noodles were a bit cold. Could be better.', 
        sentiment: 'Neutral', 
        timestamp: '5 hours ago' 
    },
    { 
        id: 3, 
        customerName: 'Priya Patel', 
        avatar: 'https://picsum.photos/id/1013/100', 
        rating: 4, 
        comment: 'Good food, but the queue was long during lunch.', 
        sentiment: 'Neutral', 
        timestamp: '1 day ago' 
    },
    { 
        id: 4, 
        customerName: 'Karan Verma', 
        avatar: 'https://picsum.photos/id/1014/100', 
        rating: 2, 
        comment: 'My order was incorrect. Had to wait a long time for a replacement.', 
        sentiment: 'Negative', 
        timestamp: '2 days ago' 
    },
    { 
        id: 5, 
        customerName: 'Anjali Mehta', 
        avatar: 'https://picsum.photos/id/1015/100', 
        rating: 5, 
        comment: 'Love the new pizza! Keep it up!', 
        sentiment: 'Positive', 
        timestamp: '3 days ago' 
    },
];

const getSentimentStyles = (sentiment: Sentiment) => {
    switch(sentiment) {
        case 'Positive': return 'bg-[#4CAF50]/20 text-[#4CAF50] border-[#4CAF50]/30';
            case 'Neutral': return 'bg-[#FF9800]/20 text-[#FF9800] border-[#FF9800]/30';
            case 'Negative': return 'bg-[#FF3D00]/20 text-[#FF3D00] border-[#FF3D00]/30';
        default: return '';
    }
};

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-[#9ca3af]/30'}`} />
            ))}
        </div>
    );
};

const FeedbackCard: React.FC<{ feedback: Feedback }> = ({ feedback }) => {
    return (
        <div className="bg-gray-900/60 backdrop-blur-md p-5 rounded-xl border border-transparent hover:border-[#FF512F] transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
                <img 
                    src={feedback.avatar} 
                    alt={feedback.customerName} 
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://picsum.photos/100/100?random';
                    }}
                />
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white">{feedback.customerName}</p>
                            <p className="text-xs text-[#9ca3af]">{feedback.timestamp}</p>
                        </div>
                        <RatingStars rating={feedback.rating} />
                    </div>
                    <p className="mt-3 text-[#9ca3af]/90">{feedback.comment}</p>
                    <div className="flex justify-between items-center mt-4">
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${getSentimentStyles(feedback.sentiment)}`}>
                            AI Sentiment: {feedback.sentiment}
                        </div>
                        <div className="flex gap-2">
                            <button className="text-xs bg-white/10 px-3 py-1 rounded-md hover:bg-white/20 transition-colors">
                                Respond
                            </button>
                            <button className="text-xs bg-white/10 px-3 py-1 rounded-md hover:bg-white/20 transition-colors">
                                Flag
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeedbackConsole: React.FC = () => {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | Sentiment>('all');

    // Simulate loading data
    useEffect(() => {
        const timer = setTimeout(() => {
            setFeedbackList(mockFeedback);
            setIsLoading(false);
        }, 1500);
        
        return () => clearTimeout(timer);
    }, []);

    const filteredFeedback = activeFilter === 'all' 
        ? feedbackList 
        : feedbackList.filter(fb => fb.sentiment === activeFilter);
        
    // Skeleton loader component
    const SkeletonFeedbackCard = () => (
        <div className="animate-pulse bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200/20" />
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200/20 rounded" />
                        <div className="h-3 w-24 bg-gray-200/20 rounded" />
                    </div>
                </div>
                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-gray-200/20 rounded" />
                    ))}
                </div>
            </div>
            <div className="space-y-2 my-4">
                <div className="h-3 bg-gray-200/20 rounded w-full" />
                <div className="h-3 bg-gray-200/20 rounded w-5/6" />
                <div className="h-3 bg-gray-200/20 rounded w-2/3" />
            </div>
            <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                    <div className="h-5 w-20 bg-gray-200/20 rounded-full" />
                    <div className="flex gap-3">
                        <div className="h-5 w-16 bg-gray-200/20 rounded-full" />
                        <div className="h-5 w-16 bg-gray-200/20 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Customer Feedback</h1>
                <p className="text-[#9ca3af]">Real-time feedback from students.</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                <button 
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                        activeFilter === 'all' 
                            ? 'bg-[#FF512F] text-white' 
                            : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
                    }`}
                >
                    All Feedback
                </button>
                <button 
                    onClick={() => setActiveFilter('Positive')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                        activeFilter === 'Positive' 
                                ? 'bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/30' 
                            : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
                    }`}
                >
                    Positive
                </button>
                <button 
                    onClick={() => setActiveFilter('Neutral')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                        activeFilter === 'Neutral' 
                                ? 'bg-[#FF9800]/20 text-[#FF9800] border border-[#FF9800]/30' 
                            : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
                    }`}
                >
                    Neutral
                </button>
                <button 
                    onClick={() => setActiveFilter('Negative')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                        activeFilter === 'Negative' 
                                        ? 'bg-[#FF3D00]/20 text-[#FF3D00] border border-[#FF3D00]/30' 
                            : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
                    }`}
                >
                    Negative
                </button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                            <SkeletonFeedbackCard key={index} />
                        ))}
                    </div>
                ) : filteredFeedback.length > 0 ? (
                    filteredFeedback.map(fb => (
                        <FeedbackCard key={fb.id} feedback={fb} />
                    ))
                ) : (
                    <div className="text-center py-12 text-[#9ca3af]">
                        No feedback found matching the selected filter.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackConsole;
