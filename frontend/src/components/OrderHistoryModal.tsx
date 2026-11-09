import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { formatRupees } from '../utils/commerce';
import { X, Package, Calendar, DollarSign, ArrowRight, CheckCircle2, Clock, Compass } from 'lucide-react';
import { Order } from '../types/models';

interface TrackingStep {
    status: string;
    date: string;
    description: string;
    completed: boolean;
}

export default function OrderHistoryModal() {
  const {
    isOrderHistoryOpen,
    setIsOrderHistoryOpen,
    orders,
    user,
    openOrderTracker
  } = useShop();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (!isOrderHistoryOpen) return null;

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Simulated Tracking Timeline Logic
  const getTimeline = (order: Order): TrackingStep[] => {
    return [
      { status: "Order Placed", date: order.date, description: "Your order has been successfully placed.", completed: true },
      { status: "Payment Verified", date: "Sept 29, 10:15 AM", description: "Secure payment confirmed.", completed: true },
      { status: "Processing", date: "Sept 30, 09:00 AM", description: "Our team is preparing your luxury items.", completed: true },
      { status: "Shipped", date: "Oct 01, 02:30 PM", description: "Package is in transit with our express courier.", completed: selectedOrder?.status === 'Shipped' },
      { status: "Delivered", date: order.estimatedDelivery, description: "Your order has arrived at the destination.", completed: selectedOrder?.status === 'Delivered' },
    ];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-scrim backdrop-blur-[3px] backdrop-in phone-xl:items-center phone-xl:p-4 sm:p-6">
      <div className="relative flex max-h-dvh w-full max-w-4xl flex-col gap-4 overflow-hidden border-hairline bg-canvas p-4 text-body shadow-scrim backdrop-blur-xl phone-xl:max-h-[88dvh] phone-xl:flex-row phone-xl:gap-6 phone-xl:rounded-[20px] phone-xl:p-6 sm:p-8 border">

        {/* Left: Order List */}
        <div className={`flex-1 flex-col transition-all duration-300 ${selectedOrderId ? 'hidden lg:flex lg:max-w-sm' : 'flex w-full'}`}>
          <div className="flex items-center justify-between pb-6 border-b border-hairline shrink-0 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-hairline flex items-center justify-center text-accent">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-body">Order History</h3>
            </div>
            <button onClick={() => setIsOrderHistoryOpen(false)} className="p-2 rounded-xl hover:bg-recess transition-colors">
              <X className="w-5 h-5 text-quiet" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <Package className="w-12 h-12 text-faint" />
                <p className="text-sm text-quiet">No orders found.</p>
              </div>
            ) : (
              orders.map((order: Order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedOrderId === order.id
                      ? 'bg-accent-soft border-accent'
                      : 'bg-recess border-hairline hover:border-hairline'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-accent uppercase">#{order.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-recess text-body">{order.status}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-body">{order.date}</span>
                    <span className="text-sm font-semibold text-success">{formatRupees(order.summary.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Order Details & Timeline */}
        {selectedOrder && (
          <div className="thin-scroll menu-in flex-1 overflow-y-auto rounded-[20px] border border-hairline bg-recess p-4 phone-lg:p-6 phone-xl:rounded-[20px]">
            <div className="flex justify-between items-start mb-6">
              <div className="min-w-0">
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-quiet lg:hidden"
                >
                  ← All orders
                </button>
                <h4 className="text-xl font-bold text-body">Order Details</h4>
                <p className="text-xs text-quiet">Shipment ID: {selectedOrder.id}</p>
              </div>
              <div className="p-2 rounded-xl bg-accent-soft text-success border border-hairline">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 text-xs phone-lg:grid-cols-2 phone-lg:gap-4">
                <div className="p-3 rounded-xl bg-recess border border-hairline">
                  <span className="text-faint block mb-1">Delivery Address</span>
                  <span className="text-body font-medium">{selectedOrder.shippingInfo.address}, {selectedOrder.shippingInfo.city}</span>
                </div>
                <div className="p-3 rounded-xl bg-recess border border-hairline">
                  <span className="text-faint block mb-1">Estimated Delivery</span>
                  <span className="text-accent font-bold">{selectedOrder.estimatedDelivery}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-xs font-bold text-body uppercase tracking-widest">Tracking Timeline</h5>
                <div className="relative space-y-6 pl-6">
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-recess" />
                  {getTimeline(selectedOrder).map((step, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      <div className={`absolute -left-[2 same as 6px] w-3 h-3 rounded-full border-2 ${step.completed ? 'bg-accent border-accent' : 'bg-panel border-hairline'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs font-bold ${step.completed ? 'text-body' : 'text-faint'}`}>{step.status}</span>
                          <span className="text-[10px] text-faint">{step.date}</span>
                        </div>
                        <p className="text-[11px] text-quiet">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsOrderHistoryOpen(false);
                      openOrderTracker(selectedOrder.id);
                    }}
                    className="w-full py-2.5 rounded-xl bg-accent text-on-solid text-xs font-bold flex items-center justify-center gap-2 shadow-quiet hover:opacity-90 transition-all"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Open Live GPS Sovereign Tracker</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
