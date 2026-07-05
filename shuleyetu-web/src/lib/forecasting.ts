/**
 * Inventory Forecasting Service
 * Predicts future inventory needs based on historical sales data
 */

export interface ForecastingItem {
  id?: string;
  name?: string;
  stock_quantity?: number;
  price_tzs?: number;
}

export interface ForecastingSale {
  item_id?: string;
  quantity?: number;
}

export interface ForecastData {
  itemId: string;
  itemName: string;
  currentStock: number;
  averageDailySales: number;
  forecastedDemand: number;
  recommendedReorderPoint: number;
  recommendedOrderQuantity: number;
  daysUntilStockout: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface InventoryForecast {
  generatedAt: string;
  forecastPeriod: { start: string; end: string };
  items: ForecastData[];
  summary: {
    itemsAtRisk: number;
    totalRecommendedOrders: number;
    estimatedCost: number;
  };
}

class ForecastingService {
  /**
   * Calculate simple moving average
   */
  private calculateMovingAverage(values: number[], period: number = 7): number {
    if (values.length < period) {
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
    const recent = values.slice(-period);
    return recent.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate forecast for a single item
   */
  forecastItem(
    itemId: string,
    itemName: string,
    currentStock: number,
    salesHistory: number[],
    leadTimeDays: number = 7,
    safetyStock: number = 10
  ): ForecastData {
    const averageDailySales = this.calculateMovingAverage(salesHistory);
    const trend = this.calculateTrend(salesHistory);

    // Adjust forecast based on trend
    let forecastedDemand = averageDailySales * 30; // 30-day forecast
    if (trend === 'increasing') {
      forecastedDemand *= 1.15; // 15% increase
    } else if (trend === 'decreasing') {
      forecastedDemand *= 0.85; // 15% decrease
    }

    // Calculate reorder point: (average daily sales × lead time) + safety stock
    const recommendedReorderPoint = averageDailySales * leadTimeDays + safetyStock;

    // Calculate order quantity using EOQ-like formula
    const recommendedOrderQuantity = Math.ceil(forecastedDemand * 1.2); // Order 20% more than forecast

    // Calculate days until stockout
    const daysUntilStockout = averageDailySales > 0 ? currentStock / averageDailySales : 999;

    // Calculate confidence (higher with more data points)
    const confidence = Math.min(0.95, 0.5 + (salesHistory.length / 100) * 0.45);

    return {
      itemId,
      itemName,
      currentStock,
      averageDailySales,
      forecastedDemand,
      recommendedReorderPoint,
      recommendedOrderQuantity,
      daysUntilStockout,
      confidence,
      trend,
    };
  }

  /**
   * Generate inventory forecast for all items
   */
  generateForecast(
    items: ForecastingItem[],
    salesData: ForecastingSale[],
    leadTimeDays: number = 7,
    safetyStock: number = 10
  ): InventoryForecast {
    const forecasts: ForecastData[] = [];
    let totalRecommendedOrders = 0;
    let estimatedCost = 0;

    items.forEach(item => {
      // Get sales history for this item (last 30 days)
      const itemSales = salesData
        .filter(sale => sale.item_id === item.id)
        .map(sale => sale.quantity || 0);

      if (itemSales.length === 0) {
        itemSales.push(0); // No sales data
      }

      const forecast = this.forecastItem(
        item.id ?? '',
        item.name ?? '',
        item.stock_quantity ?? 0,
        itemSales,
        leadTimeDays,
        safetyStock
      );

      forecasts.push(forecast);

      if (forecast.currentStock < forecast.recommendedReorderPoint) {
        totalRecommendedOrders += forecast.recommendedOrderQuantity;
        estimatedCost += forecast.recommendedOrderQuantity * (item.price_tzs || 0);
      }
    });

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      generatedAt: now.toISOString(),
      forecastPeriod: {
        start: now.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      items: forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout),
      summary: {
        itemsAtRisk: forecasts.filter(f => f.daysUntilStockout < leadTimeDays).length,
        totalRecommendedOrders,
        estimatedCost,
      },
    };
  }

  /**
   * Get items that need immediate reordering
   */
  getUrgentReorders(forecast: InventoryForecast, leadTimeDays: number = 7): ForecastData[] {
    return forecast.items.filter(item => item.daysUntilStockout < leadTimeDays);
  }

  /**
   * Get items that are overstocked
   */
  getOverstockedItems(forecast: InventoryForecast): ForecastData[] {
    return forecast.items.filter(
      item => item.currentStock > item.forecastedDemand * 1.5
    );
  }

  /**
   * Export forecast as CSV
   */
  exportAsCSV(forecast: InventoryForecast): string {
    const lines: string[] = [];

    lines.push('Inventory Forecast Report');
    lines.push(`Generated: ${forecast.generatedAt}`);
    lines.push(`Period: ${forecast.forecastPeriod.start} to ${forecast.forecastPeriod.end}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push(`Items at Risk,${forecast.summary.itemsAtRisk}`);
    lines.push(`Total Recommended Orders,${forecast.summary.totalRecommendedOrders}`);
    lines.push(`Estimated Cost,${forecast.summary.estimatedCost}`);
    lines.push('');

    lines.push('ITEM FORECASTS');
    lines.push('Item Name,Current Stock,Avg Daily Sales,Forecasted Demand,Reorder Point,Recommended Order,Days Until Stockout,Trend,Confidence');

    forecast.items.forEach(item => {
      lines.push(
        `${item.itemName},${item.currentStock},${item.averageDailySales.toFixed(2)},${item.forecastedDemand.toFixed(0)},${item.recommendedReorderPoint.toFixed(0)},${item.recommendedOrderQuantity},${item.daysUntilStockout.toFixed(1)},${item.trend},${(item.confidence * 100).toFixed(0)}%`
      );
    });

    return lines.join('\n');
  }
}

export const forecastingService = new ForecastingService();
