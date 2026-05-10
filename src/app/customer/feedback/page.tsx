"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Star, TrendingUp, Zap } from "lucide-react";
import Image from "next/image";

type FeedbackItem = {
  _id: string;
  user?: string;
  userDetails?: {
    name: string;
    email: string;
  };
  order?: string;
  rating: number;
  comment?: string;
  images?: string[];
  isAnonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
};

type ExperienceValue = "happy" | "neutral" | "unhappy";

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [starFilter, setStarFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });

  // Form
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    orderNumber: "",
    emojiRating: "" as ExperienceValue | "",
    starRating: 0,
    category: "Food",
    feedback: "",
    reportIssue: [] as string[],
    imageAttachment: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchFeedbackHistory();
  }, []);

  const fetchFeedbackHistory = async () => {
    setIsLoadingFeedback(true);
    try {
      // Use the real feedback API directly
      const feedbackRes = await fetch("/api/feedbacks", { 
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!feedbackRes.ok) {
        throw new Error(`HTTP error! status: ${feedbackRes.status}`);
      }
      
      const feedbackJson = await feedbackRes.json();
      if (feedbackJson.success) {
        console.log("Fetched feedback data:", feedbackJson.data);
        setFeedbackHistory(feedbackJson.data || []);
      } else {
        console.error("Failed to fetch feedback:", feedbackJson.error);
        toast.error(`Failed: ${feedbackJson.error}`);
      }
    } catch (err: unknown) {
      console.error("Error fetching feedback:", err);
      toast.error("Failed to load feedback history");
      setFeedbackHistory([]);
    } finally {
      setIsLoadingFeedback(false);
      setHasLoadedOnce(true);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < rating ? "text-amber-500" : "text-gray-300"}>
        ★
      </span>
    ));
  };

  const filterFeedback = () => {
    let filtered = feedbackHistory.slice();
    // Note: The new Feedback model doesn&apos;t have category, so we'll filter by rating and date
    if (starFilter !== 'all') filtered = filtered.filter((f) => f.rating === parseInt(starFilter));
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter((f) => new Date(f.createdAt).toDateString() === today);
    }
    if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
      const from = new Date(customDateRange.from);
      const to = new Date(customDateRange.to);
      filtered = filtered.filter((f) => {
        const d = new Date(f.createdAt);
        return d >= from && d <= to;
      });
    }
    return filtered;
  };

  const handleReportIssueToggle = (issue: string) => {
    setFormData((prev) => ({
      ...prev,
      reportIssue: prev.reportIssue.includes(issue)
        ? prev.reportIssue.filter(i => i !== issue)
        : [...prev.reportIssue, issue]
    }));
  };

  const validateForm = () => {
    const required = ['name', 'studentId', 'emojiRating', 'starRating', 'category', 'feedback'];
    const missing = required.filter(field => !formData[field as keyof typeof formData] ||
      (field === 'starRating' && formData.starRating === 0) ||
      (field === 'emojiRating' && !formData.emojiRating));

    if (missing.length > 0) {
      toast.error("Please fill all required fields");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        rating: formData.starRating,
        comment: formData.feedback,
        isAnonymous: formData.name === "Anonymous",
        // Note: We'll need to get the order ID from user session or recent orders
        // For now, we'll create a placeholder order reference
        order: null, // This should be updated to get real order ID
        images: formData.imageAttachment ? [URL.createObjectURL(formData.imageAttachment)] : [],
        // Additional fields from the form
        category: formData.category,
        emojiRating: formData.emojiRating,
        studentId: formData.studentId,
        orderNumber: formData.orderNumber,
        reportIssue: formData.reportIssue,
      };

      const res = await fetch("/api/feedbacks", {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (res.ok) {
        setFormData({
          name: "",
          studentId: "",
          orderNumber: "",
          emojiRating: "",
          starRating: 0,
          category: "Food",
          feedback: "",
          reportIssue: [],
          imageAttachment: null
        });
        setImagePreview(null);
        await fetchFeedbackHistory();
        toast.success("Feedback submitted successfully! Thank you for your valuable input.");
      } else {
        const errorData = await res.json();
        console.error("Submission failed:", errorData);
        toast.error(`Failed: ${errorData.error || "Unknown error"}`);
        throw new Error(errorData.error || "Failed to submit feedback");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const issues = useMemo(
    () => [
      { key: "hygiene", label: "Hygiene" },
      { key: "delay", label: "Delay" },
      { key: "Incorrect Order", label: "Incorrect Order" },
      { key: "Late Delivery", label: "Late Delivery" },
      { key: "Food Quality", label: "Food Quality" },
      { key: "Rude Staff", label: "Rude Staff" },
      { key: "Other", label: "Other" },
    ],
    []
  );

  const feedbackCharsLeft = 500 - (formData.feedback?.length ?? 0);
  const filteredHistory = useMemo(() => filterFeedback(), [feedbackHistory, categoryFilter, starFilter, dateFilter, customDateRange]);

  return (
    <div className="min-h-screen bg-[#f6efe8]">
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-4 lg:pt-20 lg:pb-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,153,64,0.25),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(255,213,128,0.35),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,0.6),rgba(255,255,255,0.2))]" />
          <div className="relative grid gap-2 p-3 sm:p-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
                We Value Your Feedback
              </h1>
              <p className="mt-2 text-base sm:text-lg text-gray-700 max-w-2xl">
                Help us serve better food, faster. Your input directly shapes menu updates and service improvements.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Takes less than 60 seconds
              </div>
            </div>

            {/* hero illustration */}
            <div className="flex justify-end">
              <div className="relative ml-auto h-54 w-full max-w-sm overflow-hidden">
                  <Image
                  src="/images/feedback_hero.png"
                  alt="Burger, drink and pizza illustration"
                  fill
                  priority
                  className="object-contain"
                  sizes="(min-width: 1024px) 320px, (min-width: 768px) 280px, 100vw"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Form card */}
          <div className="rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Share Your Experience</h2>
                  <p className="mt-1 text-sm text-gray-600">Fields marked with * are required.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                      <input
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-900 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
                        placeholder="Full Name"
                        required
                      />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Order Number <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="mt-2">
                    <input
                      suppressHydrationWarning
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-900 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
                      placeholder="Enter your order number..."
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      suppressHydrationWarning
                      name="studentId"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-900 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
                      placeholder="Enter your student ID..."
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      suppressHydrationWarning
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-900 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
                      required
                    >
                      <option value="Food">Food</option>
                      <option value="Service">Service</option>
                      <option value="Cleanliness">Cleanliness</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Experience (emoji) */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  How was your experience? <span className="text-red-500">*</span>
                </label>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[
                    { emoji: "😊", label: "Happy", value: "happy" as const },
                    { emoji: "🙂", label: "Neutral", value: "neutral" as const },
                    { emoji: "😕", label: "Unhappy", value: "unhappy" as const },
                  ].map(({ emoji, label, value }) => {
                    const active = formData.emojiRating === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setFormData({ ...formData, emojiRating: value })}
                        className={[
                          "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition",
                          active
                            ? "border-amber-300 bg-amber-50 text-amber-900 ring-4 ring-amber-200/60"
                            : "border-gray-200 bg-white/70 text-gray-800 hover:border-amber-200 hover:bg-white",
                        ].join(" ")}
                      >
                        <span className="text-lg">{emoji}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star rating */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Rate your experience <span className="text-red-500">*</span>
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, starRating: star })}
                        className="p-1.5 focus:outline-none"
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={[
                            "h-7 w-7 transition",
                            star <= formData.starRating ? "text-amber-500 fill-current" : "text-gray-300",
                          ].join(" ")}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {formData.starRating > 0 ? `${formData.starRating} of 5` : "Select a rating"}
                  </span>
                </div>
              </div>

              {/* Feedback text */}
              <div>
                <div className="flex items-end justify-between gap-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Tell us what went well or what we can improve… <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-500">{Math.max(0, feedbackCharsLeft)}/500</span>
                </div>
                <div className="mt-2">
                  <textarea
                    suppressHydrationWarning
                    value={formData.feedback}
                    onChange={(e) =>
                      setFormData({ ...formData, feedback: e.target.value.slice(0, 500) })
                    }
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-900 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
                    placeholder="Share your thoughts, suggestions, or report any issues..."
                    required
                  />
                </div>
              </div>

              {/* Quick tags */}
              <div>
                <label className="text-sm font-semibold text-gray-700">Quick tags (Optional)</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {issues.map((i) => {
                    const active = formData.reportIssue.includes(i.key);
                    return (
                      <button
                        key={i.key}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => handleReportIssueToggle(i.key)}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          active
                            ? "border-amber-300 bg-amber-50 text-amber-900"
                            : "border-gray-200 bg-white/70 text-gray-700 hover:border-amber-200 hover:bg-white",
                        ].join(" ")}
                      >
                        {i.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                suppressHydrationWarning
                disabled={isSubmitting}
                className={[
                  "w-full rounded-2xl py-3.5 text-white font-semibold shadow-sm transition",
                  "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
                  "disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
                ].join(" ")}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback →"}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur p-6">
              <h3 className="text-lg font-bold text-gray-900">Why Your Feedback Matters</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">1,240</div>
                    <div className="text-gray-600">improvements made last year</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-orange-100 p-2 text-orange-700">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Avg response time: 24 hrs</div>
                    <div className="text-gray-600">faster issue resolution</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                    <span className="block h-4 w-4 rounded-full bg-amber-500/70" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Menu updates every week</div>
                    <div className="text-gray-600">based on top requests</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur p-6">
              <h3 className="text-lg font-bold text-gray-900">Top Items This Week</h3>
              <div className="mt-4 space-y-4">
                {[
                  { name: "Spicy Paneer Pizza", rating: 4.8, votes: 1320 },
                  { name: "Cheese Burst Burger", rating: 4.6, votes: 912 },
                  { name: "Cold Coffee Deluxe", rating: 4.9, votes: 678 },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-200/70 to-orange-200/60 shadow-inner" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">{item.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          ★ {item.rating}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span>{item.votes.toLocaleString()} votes</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                          style={{ width: `${Math.min(100, (item.rating / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>

        {/* History */}
        <div className="mt-8 rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* LEFT: TEXT (VERTICALLY CENTERED) */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Your Feedback History
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Track previous submissions and admin replies.
              </p>
            </div>

            {/* RIGHT: FILTERS (NO STRETCH, PERFECT WIDTH) */}
            <div className="flex items-center gap-4 w-fit flex-none">
              <select
                suppressHydrationWarning
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-auto min-w-[120px] rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
              >
                <option value="all">All Categories</option>
                <option value="Food">Food</option>
                <option value="Service">Service</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Other">Other</option>
              </select>

              <select
                suppressHydrationWarning
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
                className="w-auto min-w-[90px] rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
              >
                <option value="all">All Stars</option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>

              <select
                suppressHydrationWarning
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-auto min-w-[90px] rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
              >
                <option value="all">Anytime</option>
                <option value="today">Today</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>


          {dateFilter === "custom" && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date"
                value={customDateRange.from}
                onChange={(e) => setCustomDateRange((p) => ({ ...p, from: e.target.value }))}
                className="rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
              />
              <input
                type="date"
                value={customDateRange.to}
                onChange={(e) => setCustomDateRange((p) => ({ ...p, to: e.target.value }))}
                className="rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 transition"
              />
            </div>
          )}

          <div className="mt-6 space-y-4 max-h-[28rem] overflow-y-auto pr-1">
            {isLoadingFeedback ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gray-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-1/3 rounded bg-gray-200 animate-pulse" />
                        <div className="mt-2 h-3 w-full rounded bg-gray-200 animate-pulse" />
                        <div className="mt-1 h-3 w-3/4 rounded bg-gray-200 animate-pulse" />
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-2">
                        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hasLoadedOnce && filteredHistory.length === 0 ? (
              <div className="text-gray-600 text-center py-10">No feedback submitted yet.</div>
            ) : (
              filteredHistory.map((f) => (
                <div key={f._id} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-amber-700 font-bold text-sm">
                          {f.userDetails?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-gray-900 text-sm">
                            {f.isAnonymous ? 'Anonymous' : (f.userDetails?.name || 'User')}
                          </h3>
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            {f.rating} ★
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(f.createdAt).toLocaleDateString("en-US")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{f.comment}</p>
                        {f.images && f.images.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {f.images.map((img, idx) => (
                              <img key={idx} src={img} alt="Feedback image" className="h-16 w-16 rounded-lg object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm">{renderStars(f.rating)}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {f.status === 'approved' ? '✓ Approved' : f.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                      </div>
                    </div>
                  </div>

                  {f.adminComment && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        <span className="font-semibold">Admin reply:</span> {f.adminComment}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
