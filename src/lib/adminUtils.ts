import { useRouter } from "next/navigation";

export function useAdminNavigation() {
  const router = useRouter();

  const navigateTo = (path: string) => router.push(path);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "active":
      case "resolved":
      case "open":
        return "bg-green-100 text-green-800";
      case "pending":
      case "in_review":
      case "on_leave":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "inactive":
      case "closed":
        return "bg-red-100 text-red-800";
      case "preparing":
      case "ready":
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  return { navigateTo, getStatusColor, formatDate, formatCurrency };
}

export function useAdminActions() {
  const handleAction = async () => ({
    success: false,
    error: new Error("Legacy demo action removed. Use the corresponding admin API."),
  });

  return {
    updateStatus: handleAction,
    deleteItem: handleAction,
    updateItem: handleAction,
    createItem: handleAction,
  };
}
