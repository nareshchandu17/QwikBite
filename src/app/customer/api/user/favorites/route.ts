import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Favorite } from "@/lib/models/Favorite";
import { MenuItem } from "@/lib/models/MenuItem";
import { getAuthCookie, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = getAuthCookie(req);
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Get user's favorites
    const favorites = await Favorite.find({ userId: decoded.id, itemType: 'menu' });
    
    // Get the actual menu items for these favorites
    const menuItemIds = favorites.map(fav => fav.itemId);
    const menuItems = await MenuItem.find({ id: { $in: menuItemIds } });

    return NextResponse.json({ 
      success: true,
      favorites: menuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category
      }))
    });
  } catch (err: unknown) {
    console.error("User favorites error:", err);
    return NextResponse.json({ 
      error: "Server error", 
      details: err.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}
