import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Admin } from '@/lib/models/Admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { sanitizeString, sanitizeObject } from '@/lib/security/sanitizer';
import bcrypt from 'bcryptjs';

const jsonResponse = (data: unknown, status = 200) => {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Helper function to check admin authorization
async function checkAuth(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'superAdmin'].includes(userRole as any)) {
        return { authorized: false, error: 'Forbidden - Only admins can manage staff', status: 403 };
    }

    return { authorized: true, session };
}

// GET /api/admin/staff - Fetch all staff members
export async function GET(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const isActive = searchParams.get('isActive');

        // Build query
        const query: any = {};
        if (role) query.role = role;
        if (isActive !== null) query.isActive = isActive === 'true';

        const staff = await Admin.find(query)
            .select('-password') // Don't return passwords
            .sort({ createdAt: -1 })
            .lean();

        return jsonResponse({ success: true, data: staff });
    } catch (err) {
        console.error('[Staff GET Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch staff' }, 500);
    }
}

// POST /api/admin/staff - Create new staff member
export async function POST(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();
        const body = await req.json();

        // Sanitize inputs
        const sanitizedBody = sanitizeObject(body);

        // Validate required fields
        const requiredFields = ['name', 'email', 'password', 'role'];
        for (const field of requiredFields) {
            if (!sanitizedBody[field]) {
                return jsonResponse({ error: `${field} is required` }, 400);
            }
        }

        // Check if email already exists
        const existingStaff = await Admin.findOne({ email: sanitizedBody.email.toLowerCase() });
        if (existingStaff) {
            return jsonResponse({ error: 'Email already exists' }, 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(sanitizedBody.password, 10);

        // Create staff member
        const staff = await Admin.create({
            name: sanitizeString(sanitizedBody.name),
            email: sanitizeString(sanitizedBody.email).toLowerCase(),
            password: hashedPassword,
            phone: sanitizedBody.phone ? sanitizeString(sanitizedBody.phone) : undefined,
            profilePic: sanitizedBody.profilePic,
            role: sanitizedBody.role,
            permissions: sanitizedBody.permissions,
            isActive: sanitizedBody.isActive !== undefined ? sanitizedBody.isActive : true,
            createdBy: authResult.session?.user?.id
        });

        // Remove password from response
        const staffResponse = staff.toObject();
        delete staffResponse.password;

        return jsonResponse({ success: true, data: staffResponse }, 201);
    } catch (err) {
        console.error('[Staff POST Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to create staff' }, 500);
    }
}

// PUT /api/admin/staff - Update staff member
export async function PUT(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();
        const body = await req.json();

        // Sanitize inputs
        const sanitizedBody = sanitizeObject(body);

        const { adminId, name, email, phone, profilePic, role, permissions, isActive, password } = sanitizedBody;

        if (!adminId) {
            return jsonResponse({ error: 'Staff ID is required' }, 400);
        }

        // Build update object
        const updateData: any = {};
        if (name) updateData.name = sanitizeString(name);
        if (email) updateData.email = sanitizeString(email).toLowerCase();
        if (phone !== undefined) updateData.phone = sanitizeString(phone);
        if (profilePic !== undefined) updateData.profilePic = profilePic;
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = permissions;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Find and update
        const staff = await Admin.findOneAndUpdate(
            { adminId },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!staff) {
            return jsonResponse({ error: 'Staff member not found' }, 404);
        }

        return jsonResponse({ success: true, data: staff });
    } catch (err) {
        console.error('[Staff PUT Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to update staff' }, 500);
    }
}

// DELETE /api/admin/staff - Delete staff member
export async function DELETE(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const adminId = searchParams.get('id');

        if (!adminId) {
            return jsonResponse({ error: 'Staff ID is required' }, 400);
        }

        // Prevent deleting the current admin
        if (adminId === authResult.session?.user?.id) {
            return jsonResponse({ error: 'Cannot delete your own account' }, 400);
        }

        const staff = await Admin.findOneAndDelete({ adminId });

        if (!staff) {
            return jsonResponse({ error: 'Staff member not found' }, 404);
        }

        return jsonResponse({ success: true, message: 'Staff member deleted successfully' });
    } catch (err) {
        console.error('[Staff DELETE Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to delete staff' }, 500);
    }
}
