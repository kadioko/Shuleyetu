import { describe, it, expect, beforeEach } from 'vitest';
import { analyticsService } from './analytics';

describe('Analytics Service', () => {
  let mockOrders: any[];
  let mockItems: any[];

  beforeEach(() => {
    mockOrders = [
      {
        id: 'order-1',
        customer_name: 'John Doe',
        customer_phone: '0712345678',
        total_amount_tzs: 100000,
        created_at: '2024-01-15T10:00:00Z',
        items: [
          {
            name: 'Mathematics Textbook',
            category: 'textbook',
            quantity: 2,
            total_price_tzs: 50000,
          },
          {
            name: 'School Uniform',
            category: 'uniform',
            quantity: 1,
            total_price_tzs: 50000,
          },
        ],
      },
      {
        id: 'order-2',
        customer_name: 'Jane Smith',
        customer_phone: '0787654321',
        total_amount_tzs: 75000,
        created_at: '2024-01-16T14:30:00Z',
        items: [
          {
            name: 'Mathematics Textbook',
            category: 'textbook',
            quantity: 1,
            total_price_tzs: 25000,
          },
          {
            name: 'Pens Pack',
            category: 'stationery',
            quantity: 3,
            total_price_tzs: 50000,
          },
        ],
      },
      {
        id: 'order-3',
        customer_name: 'John Doe',
        customer_phone: '0712345678',
        total_amount_tzs: 50000,
        created_at: '2024-01-17T09:15:00Z',
        items: [
          {
            name: 'Pens Pack',
            category: 'stationery',
            quantity: 2,
            total_price_tzs: 50000,
          },
        ],
      },
    ];

    mockItems = [
      {
        id: 'item-1',
        name: 'Mathematics Textbook',
        category: 'textbook',
        stock_quantity: 15,
        price_tzs: 25000,
      },
      {
        id: 'item-2',
        name: 'School Uniform',
        category: 'uniform',
        stock_quantity: 5,
        price_tzs: 50000,
      },
      {
        id: 'item-3',
        name: 'Pens Pack',
        category: 'stationery',
        stock_quantity: 30,
        price_tzs: 25000,
      },
    ];
  });

  describe('calculateSalesMetrics', () => {
    it('should calculate total sales correctly', () => {
      const metrics = analyticsService.calculateSalesMetrics(mockOrders);
      expect(metrics.totalSales).toBe(225000); // 100000 + 75000 + 50000
    });

    it('should calculate average order value correctly', () => {
      const metrics = analyticsService.calculateSalesMetrics(mockOrders);
      expect(metrics.averageOrderValue).toBe(75000); // 225000 / 3
    });

    it('should count total orders correctly', () => {
      const metrics = analyticsService.calculateSalesMetrics(mockOrders);
      expect(metrics.totalOrders).toBe(3);
    });

    it('should identify top products', () => {
      const metrics = analyticsService.calculateSalesMetrics(mockOrders);
      expect(metrics.topProducts.length).toBeGreaterThan(0);
      expect(metrics.topProducts[0].name).toBe('Pens Pack');
    });

    it('should identify top categories', () => {
      const metrics = analyticsService.calculateSalesMetrics(mockOrders);
      expect(metrics.topCategories.length).toBeGreaterThan(0);
      expect(metrics.topCategories[0].name).toBe('stationery');
    });

    it('should generate sales trend', () => {
      const metrics = analyticsService.calculateSalesMetrics(mockOrders);
      expect(metrics.salesTrend.length).toBe(3);
      expect(metrics.salesTrend[0].date).toBe('2024-01-15');
    });

    it('should handle empty orders', () => {
      const metrics = analyticsService.calculateSalesMetrics([]);
      expect(metrics.totalSales).toBe(0);
      expect(metrics.totalOrders).toBe(0);
      expect(metrics.averageOrderValue).toBe(0);
    });
  });

  describe('calculateInventoryMetrics', () => {
    it('should count total items correctly', () => {
      const metrics = analyticsService.calculateInventoryMetrics(mockItems);
      expect(metrics.totalItems).toBe(3);
    });

    it('should identify low stock items', () => {
      const metrics = analyticsService.calculateInventoryMetrics(mockItems);
      expect(metrics.lowStockItems).toBe(1); // School Uniform with 5 units
    });

    it('should identify out of stock items', () => {
      const outOfStockItems = [...mockItems, { ...mockItems[0], stock_quantity: 0 }];
      const metrics = analyticsService.calculateInventoryMetrics(outOfStockItems);
      expect(metrics.outOfStockItems).toBe(1);
    });

    it('should calculate average stock level', () => {
      const metrics = analyticsService.calculateInventoryMetrics(mockItems);
      expect(metrics.averageStockLevel).toBe((15 + 5 + 30) / 3); // 16.67
    });

    it('should handle empty inventory', () => {
      const metrics = analyticsService.calculateInventoryMetrics([]);
      expect(metrics.totalItems).toBe(0);
      expect(metrics.averageStockLevel).toBe(0);
    });
  });

  describe('calculateCustomerMetrics', () => {
    it('should count total customers', () => {
      const metrics = analyticsService.calculateCustomerMetrics(mockOrders);
      expect(metrics.totalCustomers).toBe(2); // John Doe and Jane Smith
    });

    it('should identify repeat customers', () => {
      const metrics = analyticsService.calculateCustomerMetrics(mockOrders);
      expect(metrics.repeatCustomers).toBe(1); // John Doe has 2 orders
    });

    it('should calculate repeat rate', () => {
      const metrics = analyticsService.calculateCustomerMetrics(mockOrders);
      expect(metrics.repeatRate).toBe(50); // 1 out of 2 customers
    });

    it('should identify top customers', () => {
      const metrics = analyticsService.calculateCustomerMetrics(mockOrders);
      expect(metrics.topCustomers.length).toBeGreaterThan(0);
      expect(metrics.topCustomers[0].name).toBe('0712345678'); // John Doe's phone
    });

    it('should handle empty orders', () => {
      const metrics = analyticsService.calculateCustomerMetrics([]);
      expect(metrics.totalCustomers).toBe(0);
      expect(metrics.repeatRate).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive report', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      const report = analyticsService.generateReport(mockOrders, mockItems, startDate, endDate);

      expect(report.period.start).toBe('2024-01-15');
      expect(report.period.end).toBe('2024-01-17');
      expect(report.sales).toBeDefined();
      expect(report.inventory).toBeDefined();
      expect(report.customers).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should identify best day', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      const report = analyticsService.generateReport(mockOrders, mockItems, startDate, endDate);

      expect(report.summary.bestDay.sales).toBe(100000);
    });

    it('should identify worst day', () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-17T23:59:59Z');
      const report = analyticsService.generateReport(mockOrders, mockItems, startDate, endDate);

      expect(report.summary.worstDay.sales).toBe(50000);
    });

    it('should include forecast', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      const report = analyticsService.generateReport(mockOrders, mockItems, startDate, endDate);

      expect(report.summary.forecast).toBeDefined();
      expect(report.summary.forecast.nextMonth).toBeGreaterThan(0);
      expect(report.summary.forecast.confidence).toBeGreaterThan(0);
    });
  });

  describe('exportAsCSV', () => {
    it('should export report as CSV', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      const report = analyticsService.generateReport(mockOrders, mockItems, startDate, endDate);
      const csv = analyticsService.exportAsCSV(report);

      expect(csv).toContain('Shuleyetu Analytics Report');
      expect(csv).toContain('SALES METRICS');
      expect(csv).toContain('INVENTORY METRICS');
      expect(csv).toContain('CUSTOMER METRICS');
    });
  });

  describe('exportAsJSON', () => {
    it('should export report as JSON', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      const report = analyticsService.generateReport(mockOrders, mockItems, startDate, endDate);
      const json = analyticsService.exportAsJSON(report);
      const parsed = JSON.parse(json);

      expect(parsed.period).toBeDefined();
      expect(parsed.sales).toBeDefined();
      expect(parsed.inventory).toBeDefined();
      expect(parsed.customers).toBeDefined();
    });
  });
});
