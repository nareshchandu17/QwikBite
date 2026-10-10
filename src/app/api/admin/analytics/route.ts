import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Order, PaymentStatus } from "@/models/order.model";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role || "").toLowerCase();

    if (!session?.user?.id || !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const days = Math.min(
      90,
      Math.max(1, Number(req.nextUrl.searchParams.get("days") || 7)),
    );

    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);
    const previousStart = new Date(start.getTime() - days * 86_400_000);

    const [dailySales, topDishes, peakHours, summary, previous] =
      await Promise.all([
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: PaymentStatus.PAID,
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              sales: { $sum: "$totalAmount" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: PaymentStatus.PAID,
              status: { $ne: "cancelled" },
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.name",
              orders: { $sum: "$items.quantity" },
              revenue: {
                $sum: {
                  $multiply: ["$items.price", "$items.quantity"],
                },
              },
            },
          },
          { $sort: { orders: -1 } },
          { $limit: 5 },
        ]),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: PaymentStatus.PAID,
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: {
                $hour: {
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              orders: { $sum: 1 },
              revenue: { $sum: "$totalAmount" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              cancelledOrders: {
                $sum: {
                  $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
                },
              },
              paidRevenue: {
                $sum: {
                  $cond: [
                    { $eq: ["$paymentStatus", PaymentStatus.PAID] },
                    "$totalAmount",
                    0,
                  ],
                },
              },
              paidOrders: {
                $sum: {
                  $cond: [
                    { $eq: ["$paymentStatus", PaymentStatus.PAID] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: previousStart, $lt: start },
              paymentStatus: PaymentStatus.PAID,
              status: { $ne: "cancelled" },
            },
          },
          { $group: { _id: null, paidRevenue: { $sum: "$totalAmount" } } },
        ]),
      ]);

    const summaryRow = summary[0] || {
      totalOrders: 0,
      cancelledOrders: 0,
      paidRevenue: 0,
      paidOrders: 0,
    };

    const previousRevenue = previous[0]?.paidRevenue || 0;
    const growthRate =
      previousRevenue > 0
        ? Number(
            (
              ((summaryRow.paidRevenue - previousRevenue) /
                previousRevenue) *
              100
            ).toFixed(1),
          )
        : summaryRow.paidRevenue > 0
          ? 100
          : 0;

    const busiest = peakHours.reduce(
      (best, item) => (!best || item.orders > best.orders ? item : best),
      null as any,
    );

    const formatHour = (hour: number) => {
      const normalized = hour % 12 || 12;
      return `${normalized} ${hour >= 12 ? "PM" : "AM"}`;
    };

    return NextResponse.json({
      dailySales: dailySales.map((item) => ({
        name: item._id,
        sales: Math.round(item.sales || 0),
        orders: item.orders || 0,
      })),
      topDishes: topDishes.map((item) => ({
        name: item._id,
        orders: item.orders || 0,
        revenue: Math.round(item.revenue || 0),
      })),
      peakHours: peakHours.map((item) => ({
        hour: formatHour(item._id),
        orders: item.orders || 0,
        revenue: Math.round(item.revenue || 0),
      })),
      insights: {
        studentFavorites: topDishes[0]?._id || "No data",
        cancellationRatio:
          summaryRow.totalOrders > 0
            ? `${(
                (summaryRow.cancelledOrders / summaryRow.totalOrders) *
                100
              ).toFixed(1)}%`
            : "0.0%",
        busiestTime: busiest ? formatHour(busiest._id) : "No data",
        avgOrderValue:
          summaryRow.paidOrders > 0
            ? `₹${Math.round(
                summaryRow.paidRevenue / summaryRow.paidOrders,
              ).toLocaleString("en-IN")}`
            : "₹0",
        totalRevenue: Math.round(summaryRow.paidRevenue || 0),
        totalOrders: summaryRow.totalOrders || 0,
        growthRate,
      },
      metadata: {
        realDataPercentage: 100,
        mockDataPercentage: 0,
        lastUpdated: new Date().toISOString(),
        dataSource: "real",
      },
    });
  } catch (error) {
    logger.error("[Analytics API] Error", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}
