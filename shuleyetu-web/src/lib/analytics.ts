/**
 * Advanced Analytics and Reporting Service
 */

// Minimal shape of an order row as consumed by analytics
export interface AnalyticsOrder {
  id?: string;
  total_amount_tzs?: number;
  status?: string;
  payment_status?: string;
  created_at?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  items?: Array<{
    name?: string;
    category?: string;
    quantity?: number;
    total_price_tzs?: number;
  }>;
}

// Minimal shape of an inventory item as consumed by analytics
export interface AnalyticsItem {
  id?: string;
  name?: string;
  stock_quantity?: number;
  price_tzs?: number;
}

export interface SalesMetrics {
  totalSales: number;
  averageOrderValue: number;
  totalOrders: number;
  conversionRate: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  topCategories: Array<{ name: string; quantity: number; revenue: number }>;
  salesTrend: Array<{ date: string; sales: number; orders: number }>;
}

export interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStockLevel: number;
  fastMovingItems: Array<{ name: string; quantity: number; turnoverRate: number }>;
  slowMovingItems: Array<{ name: string; quantity: number; turnoverRate: number }>;
}

export interface CustomerMetrics {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  averageCustomerValue: number;
  customerRetention: number;
  topCustomers: Array<{ name: string; orders: number; totalSpent: number }>;
}

export interface AnalyticsReport {
  period: { start: string; end: string };
  sales: SalesMetrics;
  inventory: InventoryMetrics;
  customers: CustomerMetrics;
  summary: {
    bestDay: { date: string; sales: number };
    worstDay: { date: string; sales: number };
    growthRate: number;
    forecast: { nextMonth: number; confidence: number };
  };
}

class AnalyticsService {
  /**
   * Calculate sales metrics
   */
  calculateSalesMetrics(orders: AnalyticsOrder[]): SalesMetrics {
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + (order.total_amount_tzs || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach(order => {
      order.items?.forEach((item) => {
        const key = item.name ?? '';
        const existing = productMap.get(key) || { name: item.name ?? '', quantity: 0, revenue: 0 };
        existing.quantity += item.quantity || 0;
        existing.revenue += item.total_price_tzs || 0;
        productMap.set(key, existing);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate top categories
    const categoryMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach(order => {
      order.items?.forEach((item) => {
        const key = item.category ?? '';
        const existing = categoryMap.get(key) || { name: item.category ?? '', quantity: 0, revenue: 0 };
        existing.quantity += item.quantity || 0;
        existing.revenue += item.total_price_tzs || 0;
        categoryMap.set(key, existing);
      });
    });

    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate sales trend (daily)
    const trendMap = new Map<string, { sales: number; orders: number }>();
    orders.forEach(order => {
      if (!order.created_at) return;
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { sales: 0, orders: 0 };
      existing.sales += order.total_amount_tzs || 0;
      existing.orders += 1;
      trendMap.set(date, existing);
    });

    const salesTrend = Array.from(trendMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSales,
      averageOrderValue,
      totalOrders,
      conversionRate: 0, // Would need visitor data
      topProducts,
      topCategories,
      salesTrend,
    };
  }

  /**
   * Calculate inventory metrics
   */
  calculateInventoryMetrics(items: AnalyticsItem[]): InventoryMetrics {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => (item.stock_quantity ?? 0) > 0 && (item.stock_quantity ?? 0) <= 10).length;
    const outOfStockItems = items.filter(item => (item.stock_quantity ?? 0) === 0).length;
    const totalStock = items.reduce((sum, item) => sum + (item.stock_quantity || 0), 0);
    const averageStockLevel = totalItems > 0 ? totalStock / totalItems : 0;

    // Fast and slow moving items (would need sales velocity data)
    const fastMovingItems = items
      .filter(item => (item.stock_quantity ?? 0) < averageStockLevel)
      .slice(0, 5)
      .map(item => ({
        name: item.name ?? '',
        quantity: item.stock_quantity ?? 0,
        turnoverRate: 0, // Would calculate from sales history
      }));

    const slowMovingItems = items
      .filter(item => (item.stock_quantity ?? 0) > averageStockLevel)
      .slice(0, 5)
      .map(item => ({
        name: item.name ?? '',
        quantity: item.stock_quantity ?? 0,
        turnoverRate: 0,
      }));

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      averageStockLevel,
      fastMovingItems,
      slowMovingItems,
    };
  }

  /**
   * Calculate customer metrics
   */
  calculateCustomerMetrics(orders: AnalyticsOrder[]): CustomerMetrics {
    const customerMap = new Map<string, { orders: number; totalSpent: number }>();

    orders.forEach(order => {
      const customerId = order.customer_phone || order.customer_name || 'Unknown';
      const existing = customerMap.get(customerId) || { orders: 0, totalSpent: 0 };
      existing.orders += 1;
      existing.totalSpent += order.total_amount_tzs || 0;
      customerMap.set(customerId, existing);
    });

    const totalCustomers = customerMap.size;
    const repeatCustomers = Array.from(customerMap.values()).filter(c => c.orders > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    const totalSpent = Array.from(customerMap.values()).reduce((sum, c) => sum + c.totalSpent, 0);
    const averageCustomerValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    const topCustomers = Array.from(customerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalCustomers,
      repeatCustomers,
      repeatRate,
      averageCustomerValue,
      customerRetention: repeatRate,
      topCustomers,
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  generateReport(orders: AnalyticsOrder[], items: AnalyticsItem[], startDate: Date, endDate: Date): AnalyticsReport {
    const filteredOrders = orders.filter(order => {
      if (!order.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const sales = this.calculateSalesMetrics(filteredOrders);
    const inventory = this.calculateInventoryMetrics(items);
    const customers = this.calculateCustomerMetrics(filteredOrders);

    // Calculate summary metrics
    const dailySales = sales.salesTrend;
    const bestDay = dailySales.reduce((max, day) => (day.sales > max.sales ? day : max), dailySales[0] || { date: '', sales: 0 });
    const worstDay = dailySales.reduce((min, day) => (day.sales < min.sales ? day : min), dailySales[0] || { date: '', sales: 0 });

    // Calculate growth rate (compare with previous period)
    const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate.getTime() - periodLength * 24 * 60 * 60 * 1000);
    const previousOrders = orders.filter(order => {
      if (!order.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= previousStartDate && orderDate < startDate;
    });
    const previousSales = previousOrders.reduce((sum, order) => sum + (order.total_amount_tzs || 0), 0);
    const growthRate = previousSales > 0 ? ((sales.totalSales - previousSales) / previousSales) * 100 : 0;

    // Simple forecast (linear extrapolation)
    const nextMonthForecast = sales.totalSales * (1 + growthRate / 100);

    return {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      sales,
      inventory,
      customers,
      summary: {
        bestDay,
        worstDay,
        growthRate,
        forecast: {
          nextMonth: nextMonthForecast,
          confidence: 0.75, // 75% confidence
        },
      },
    };
  }

  /**
   * Export report as CSV
   */
  exportAsCSV(report: AnalyticsReport): string {
    const lines: string[] = [];

    lines.push('Shuleyetu Analytics Report');
    lines.push(`Period: ${report.period.start} to ${report.period.end}`);
    lines.push('');

    // Sales metrics
    lines.push('SALES METRICS');
    lines.push(`Total Sales,${report.sales.totalSales}`);
    lines.push(`Total Orders,${report.sales.totalOrders}`);
    lines.push(`Average Order Value,${report.sales.averageOrderValue}`);
    lines.push('');

    // Top products
    lines.push('TOP PRODUCTS');
    lines.push('Product,Quantity,Revenue');
    report.sales.topProducts.forEach(p => {
      lines.push(`${p.name},${p.quantity},${p.revenue}`);
    });
    lines.push('');

    // Inventory metrics
    lines.push('INVENTORY METRICS');
    lines.push(`Total Items,${report.inventory.totalItems}`);
    lines.push(`Low Stock Items,${report.inventory.lowStockItems}`);
    lines.push(`Out of Stock,${report.inventory.outOfStockItems}`);
    lines.push('');

    // Customer metrics
    lines.push('CUSTOMER METRICS');
    lines.push(`Total Customers,${report.customers.totalCustomers}`);
    lines.push(`Repeat Customers,${report.customers.repeatCustomers}`);
    lines.push(`Repeat Rate,${report.customers.repeatRate.toFixed(2)}%`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Export report as JSON
   */
  exportAsJSON(report: AnalyticsReport): string {
    return JSON.stringify(report, null, 2);
  }
}

export const analyticsService = new AnalyticsService();
