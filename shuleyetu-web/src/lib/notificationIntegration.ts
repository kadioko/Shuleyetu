/**
 * Notification Integration Service
 * Connects notifications to order lifecycle events
 */

import { notificationService, OrderNotification, VendorNotification } from './notifications';
import { supabaseClient } from './supabaseClient';

export interface OrderEvent {
  orderId: string;
  event: 'created' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_received';
  orderData: {
    customerPhone: string;
    customerName: string;
    vendorPhone?: string;
    vendorName?: string;
    amount?: number;
    status?: string;
  };
}

/** Shape of an order row passed to notification handlers */
export interface NotificationOrderData {
  customer_phone?: string;
  customer_name?: string;
  vendor_id?: string;
  total_amount_tzs?: number;
  items?: Array<{ name?: string }>;
}

/** Shape of an inventory item passed to low-stock handlers */
export interface NotificationItemData {
  id?: string;
  name?: string;
  stock_quantity?: number;
}

/** Shape of a notification log row */
export interface NotificationLogRow {
  id?: string;
  event_type?: string;
  resource_id?: string;
  status?: string;
  details?: unknown;
  created_at?: string;
}

class NotificationIntegrationService {
  /**
   * Handle order creation event
   */
  async handleOrderCreated(orderId: string, orderData: NotificationOrderData): Promise<void> {
    try {
      // Send customer notification
      const customerNotification: OrderNotification = {
        orderId,
        customerPhone: orderData.customer_phone ?? '',
        customerName: orderData.customer_name ?? '',
        status: 'created',
        orderTotal: orderData.total_amount_tzs,
      };

      await notificationService.notifyOrderStatus(customerNotification);

      // Send vendor notification
      const vendor = await this.getVendorPhone(orderData.vendor_id);
      if (vendor) {
        const vendorNotification: VendorNotification = {
          vendorPhone: vendor.phone,
          vendorName: vendor.name,
          event: 'new_order',
          details: {
            orderId,
            customerName: orderData.customer_name,
            amount: orderData.total_amount_tzs,
            itemCount: orderData.items?.length || 0,
          },
        };

        await notificationService.notifyVendor(vendorNotification);
      }

      // Log event
      await this.logNotificationEvent('order_created', orderId, 'success');
    } catch (error) {
      console.error('Error handling order created event:', error);
      await this.logNotificationEvent('order_created', orderId, 'error', error);
      throw error;
    }
  }

  /**
   * Handle order status update event
   */
  async handleOrderStatusUpdate(
    orderId: string,
    newStatus: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    orderData: NotificationOrderData
  ): Promise<void> {
    try {
      // Send customer notification
      const customerNotification: OrderNotification = {
        orderId,
        customerPhone: orderData.customer_phone ?? '',
        customerName: orderData.customer_name ?? '',
        status: newStatus,
      };

      await notificationService.notifyOrderStatus(customerNotification);

      // Log event
      await this.logNotificationEvent('order_status_updated', orderId, 'success', {
        newStatus,
      });
    } catch (error) {
      console.error('Error handling order status update:', error);
      await this.logNotificationEvent('order_status_updated', orderId, 'error', error);
      throw error;
    }
  }

  /**
   * Handle payment received event
   */
  async handlePaymentReceived(orderId: string, orderData: NotificationOrderData): Promise<void> {
    try {
      // Send customer notification
      const customerNotification: OrderNotification = {
        orderId,
        customerPhone: orderData.customer_phone ?? '',
        customerName: orderData.customer_name ?? '',
        status: 'delivered',
        orderTotal: orderData.total_amount_tzs,
      };

      await notificationService.notifyOrderStatus(customerNotification);

      // Send vendor notification
      const vendor = await this.getVendorPhone(orderData.vendor_id);
      if (vendor) {
        const vendorNotification: VendorNotification = {
          vendorPhone: vendor.phone,
          vendorName: vendor.name,
          event: 'payment_received',
          details: {
            orderId,
            amount: orderData.total_amount_tzs,
            customerName: orderData.customer_name,
          },
        };

        await notificationService.notifyVendor(vendorNotification);
      }

      // Log event
      await this.logNotificationEvent('payment_received', orderId, 'success');
    } catch (error) {
      console.error('Error handling payment received event:', error);
      await this.logNotificationEvent('payment_received', orderId, 'error', error);
      throw error;
    }
  }

  /**
   * Handle low stock alert
   */
  async handleLowStockAlert(vendorId: string, itemData: NotificationItemData): Promise<void> {
    try {
      // Get vendor phone
      const vendor = await this.getVendorPhone(vendorId);
      if (!vendor) return;

      const notification: VendorNotification = {
        vendorPhone: vendor.phone,
        vendorName: vendor.name,
        event: 'low_stock',
        details: {
          itemName: itemData.name,
          quantity: itemData.stock_quantity,
          itemId: itemData.id,
        },
      };

      await notificationService.notifyVendor(notification);

      // Log event
      await this.logNotificationEvent('low_stock_alert', itemData.id ?? '', 'success');
    } catch (error) {
      console.error('Error handling low stock alert:', error);
      await this.logNotificationEvent('low_stock_alert', itemData.id ?? '', 'error', error);
      throw error;
    }
  }

  /**
   * Setup order lifecycle listeners
   * Note: Real-time subscriptions should be set up on the server side
   * This is a reference implementation for webhook handling
   */
  async setupOrderListeners(): Promise<void> {
    try {
      // Real-time subscriptions are handled via webhooks in production
      // This method documents the event types that should trigger notifications
      console.log('Order lifecycle listeners configured for webhook handling');
      console.log('Events: INSERT (order created), UPDATE (status/payment changes)');
    } catch (error) {
      console.error('Error setting up order listeners:', error);
      throw error;
    }
  }

  /**
   * Setup inventory listeners
   * Note: Real-time subscriptions should be set up on the server side
   * This is a reference implementation for webhook handling
   */
  async setupInventoryListeners(): Promise<void> {
    try {
      // Real-time subscriptions are handled via webhooks in production
      // This method documents the event types that should trigger notifications
      console.log('Inventory lifecycle listeners configured for webhook handling');
      console.log('Events: UPDATE (stock quantity changes)');
    } catch (error) {
      console.error('Error setting up inventory listeners:', error);
      throw error;
    }
  }

  /**
   * Get vendor phone number
   */
  private async getVendorPhone(vendorId?: string): Promise<{ phone: string; name: string } | null> {
    if (!vendorId) return null;
    try {
      const { data, error } = await supabaseClient
        .from('vendors')
        .select('phone, name')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vendor phone:', error);
      return null;
    }
  }

  /**
   * Log notification event for monitoring
   */
  private async logNotificationEvent(
    eventType: string,
    resourceId: string,
    status: 'success' | 'error',
    details?: unknown
  ): Promise<void> {
    try {
      await supabaseClient.from('notification_logs').insert([
        {
          event_type: eventType,
          resource_id: resourceId,
          status,
          details,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }

  /**
   * Get notification logs for monitoring
   */
  async getNotificationLogs(
    limit: number = 100,
    offset: number = 0
  ): Promise<NotificationLogRow[]> {
    try {
      const { data, error } = await supabaseClient
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      return [];
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(days: number = 7): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabaseClient
        .from('notification_logs')
        .select('status')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const successful = data?.filter(d => d.status === 'success').length || 0;
      const failed = total - successful;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      return {
        total,
        successful,
        failed,
        successRate,
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
      };
    }
  }
}

export const notificationIntegrationService = new NotificationIntegrationService();
