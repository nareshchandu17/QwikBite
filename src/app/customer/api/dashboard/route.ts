import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { MenuItem } from "@/lib/models/MenuItem";
import { Favorite } from "@/lib/models/Favorite";
import { getAuthCookie, verifyToken } from "@/lib/auth";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = getAuthCookie(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError: any) {
      console.error('Token verification error:', tokenError);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: corsHeaders }
      );
    }
    
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503, headers: corsHeaders }
      );
    }

    // Get user stats
    let totalUsers = 0;
    let totalOrders = 0;
    let recentOrders: unknown[] = [];
    let totalMenuItems = 0;
    let availableMenuItems = 0;
    let totalFavorites = 0;
    let userOrders: unknown[] = [];

    try {
      totalUsers = await User.countDocuments();
      totalOrders = await Order.countDocuments();
      recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
      totalMenuItems = await MenuItem.countDocuments();
      availableMenuItems = await MenuItem.countDocuments({ available: true });
      totalFavorites = await Favorite.countDocuments();
      
      // Get user's recent orders if they're a customer
      if (decoded.role === 'customer') {
        userOrders = await Order.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(5).lean();
      }
    } catch (queryError: any) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { error: "Failed to fetch dashboard data" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Calculate user-specific stats
    const userOrderStats = {
      totalOrders: decoded.role === 'customer' ? userOrders.length : 0,
      pendingOrders: userOrders.filter((o: any) => o.status === 'pending' || o.status === 'received').length,
      completedOrders: userOrders.filter((o: any) => o.status === 'completed').length,
    };

    return NextResponse.json(
      {
        success: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
        stats: {
          users: {
            total: totalUsers
          },
          orders: {
            total: totalOrders,
            recent: recentOrders.map((order: any) => ({
              id: order.id || order._id?.toString(),
              total: order.total || 0,
              status: order.status || 'unknown',
              createdAt: order.createdAt
            }))
          },
          menu: {
            total: totalMenuItems,
            available: availableMenuItems
          },
          favorites: {
            total: totalFavorites
          },
          userOrders: userOrders.map((order: any) => ({
            id: order.id || order._id?.toString(),
            total: order.total || 0,
            status: order.status || 'unknown',
            createdAt: order.createdAt
          })),
          totalOrders: userOrderStats.totalOrders,
          pendingOrders: userOrderStats.pendingOrders,
          completedOrders: userOrderStats.completedOrders,
        }
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      {
        error: "Server error",
        details: err.message || "Unknown error occurred"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
