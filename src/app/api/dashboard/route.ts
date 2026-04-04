import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Transaction from '@/models/Transaction';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// GET /api/dashboard — Aggregated dashboard stats
export async function GET() {
    try {
        await dbConnect();

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Parallel queries
        const [
            totalOrdersThisMonth,
            totalOrdersLastMonth,
            revenueThisMonth,
            revenueLastMonth,
            recentOrders,
            lowStockProducts,
            channelStats,
            monthlyRevenue,
        ] = await Promise.all([
            // Orders this month
            Order.countDocuments({
                createdAt: { $gte: startOfMonth },
                status: { $nin: ['cancelled', 'refunded'] },
            }),
            // Orders last month
            Order.countDocuments({
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                status: { $nin: ['cancelled', 'refunded'] },
            }),
            // Revenue this month
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfMonth },
                        status: { $nin: ['cancelled', 'refunded'] },
                    },
                },
                { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
            // Revenue last month
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                        status: { $nin: ['cancelled', 'refunded'] },
                    },
                },
                { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
            // Recent orders (5)
            Order.find()
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            // Low stock products — pre-filter with index-friendly stock <= 50,
            // then use $expr only on the small candidate set
            Product.aggregate([
                { $match: { isActive: true, stock: { $lte: 50 } } },
                {
                    $match: {
                        $expr: { $lte: ['$stock', { $ifNull: ['$lowStockAlert', 10] }] },
                    },
                },
                { $sort: { stock: 1 } },
                { $limit: 10 },
                { $project: { name: 1, sku: 1, stock: 1, lowStockAlert: 1, images: 1 } },
            ]),
            // Channel distribution
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfMonth },
                        status: { $nin: ['cancelled', 'refunded'] },
                    },
                },
                { $group: { _id: '$channel', count: { $sum: 1 } } },
            ]),
            // Monthly revenue for the year
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(now.getFullYear(), 0, 1) },
                        status: { $nin: ['cancelled', 'refunded'] },
                    },
                },
                {
                    $group: {
                        _id: { $month: '$createdAt' },
                        total: { $sum: '$total' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const revThisMonth = revenueThisMonth[0]?.total || 0;
        const revLastMonth = revenueLastMonth[0]?.total || 0;
        const revChange = revLastMonth > 0 ? Math.round(((revThisMonth - revLastMonth) / revLastMonth) * 100) : 0;
        const orderChange = totalOrdersLastMonth > 0
            ? totalOrdersThisMonth - totalOrdersLastMonth
            : totalOrdersThisMonth;
        const avgOrderValue = totalOrdersThisMonth > 0 ? Math.round(revThisMonth / totalOrdersThisMonth) : 0;

        // Format channel data
        const channelColors: Record<string, string> = {
            online: '#00C4AD',
            pos: '#F0356A',
            phone: '#F0A500',
        };
        const totalChannelOrders = channelStats.reduce((s: number, c: { count: number }) => s + c.count, 0) || 1;
        const channels = channelStats.map((c: { _id: string; count: number }) => ({
            label: c._id === 'online' ? 'Web' : c._id === 'pos' ? 'POS' : c._id || 'Khác',
            value: Math.round((c.count / totalChannelOrders) * 100),
            count: c.count,
            color: channelColors[c._id] || '#7B3FF2',
        }));

        // Format monthly revenue
        const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
            const found = monthlyRevenue.find((m: { _id: number; total: number }) => m._id === i + 1);
            return {
                label: `T${i + 1}`,
                value: found ? Math.round(found.total / 1000000) : 0,
            };
        });

        return apiSuccess({
            kpis: {
                revenue: revThisMonth,
                revenueChange: revChange,
                orders: totalOrdersThisMonth,
                orderChange,
                avgOrderValue,
                lowStockCount: lowStockProducts.length,
            },
            revenueChart: revenueByMonth,
            channels,
            totalOrders: totalOrdersThisMonth,
            recentOrders: recentOrders.map((o: Record<string, unknown>) => ({
                _id: o._id,
                orderCode: o.orderCode,
                customer: (o.customerInfo as Record<string, string>)?.name || (o.user as Record<string, string>)?.name || 'N/A',
                product: (o.items as { product: string }[])?.[0]
                    ? `${(o.items as { product: string }[]).length} sản phẩm`
                    : 'N/A',
                amount: o.total,
                status: o.status,
            })),
            lowStock: lowStockProducts.map((p: Record<string, unknown>) => ({
                _id: p._id,
                name: p.name,
                sku: p.sku,
                stock: p.stock,
                level: (p.stock as number) <= Math.ceil(((p.lowStockAlert as number) || 10) * 0.3) ? 'critical' : 'low',
            })),
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
