import { useEffect } from 'react';
import { useShop } from '../context/ShopContext.tsx';

export const useInventorySocket = () => {
  const { setProducts, showToast } = useShop();

  useEffect(() => {
    // Use the environment's API base URL (defaulting to localhost for dev)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}/api/v1/ws/inventory`;

    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log('Connected to Inventory WebSocket');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'STOCK_UPDATED') {
          const { product_id, new_stock } = data.payload;

          // Update the products state in the context
          setProducts((prevProducts) =>
            prevProducts.map(p =>
              p.id === product_id ? { ...p, stock: new_stock } : p
            )
          );

          showToast(`Live Update: Product #${product_id} stock is now ${new_stock}`, 'info');
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    socket.onerror = (error) => {
      console.error('Inventory WebSocket Error:', error);
    };

    socket.onclose = () => {
      console.log('Disconnected from Inventory WebSocket');
    };

    return () => {
      socket.close();
    };
  }, [setProducts, showToast]);
};
