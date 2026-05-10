export type Sentiment = 'Positive' | 'Neutral' | 'Negative';

export interface Feedback {
    id: number;
    customerName: string;
    avatar: string;
    rating: number;
    comment: string;
    sentiment: Sentiment;
    timestamp: string;
}

export interface FeedbackItem {
  _id: string;
  name: string;
  studentId: string;
  orderReference?: string;
  quickRating: string;
  starRating: number;
  category: string;
  feedbackText: string;
  reportIssue: string[];
  image?: string;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackClassification {
  overallSentiment: 'Positive' | 'Mixed' | 'Negative' | 'Neutral';
  userIntent: string[];
  emotionalIntensity: 'Low' | 'Medium' | 'High';
  keyInsight: string;
  operationalImpact: 'None' | 'Low' | 'Medium' | 'High';
  priorityLevel: 'Informational' | 'Monitor' | 'Needs Attention' | 'Urgent';
  recommendedAction: string;
  tags: string[];
  suggestedResponse: string;
}

export interface FeedbackWithClassification {
  _id: string;
  name: string;
  studentId: string;
  orderReference?: string;
  starRating: number;
  category: string;
  feedbackText: string;
  reportIssue: string[];
  createdAt: string;
  adminReply?: string;
  classification?: FeedbackClassification;
}

export interface Stats {
  totalFeedbacks: number;
  urgentCount: number;
  needsAttentionCount: number;
  monitorCount: number;
  informationalCount: number;
  positiveCount: number;
  mixedCount: number;
  negativeCount: number;
  neutralCount: number;
  highImpactCount: number;
}
