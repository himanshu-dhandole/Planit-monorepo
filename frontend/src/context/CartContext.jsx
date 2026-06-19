import React, { createContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('planit_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('planit_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (service, startDt, endDt, eventId, eventTitle) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.service.id === service.id && item.eventId === eventId
      );
      if (existingItem) {
        toast.info(`"${service.name}" is already in your cart for event "${eventTitle}". Updated dates!`);
        return prevCart.map((item) =>
          item.service.id === service.id && item.eventId === eventId
            ? { ...item, startDt, endDt }
            : item
        );
      }
      toast.success(`"${service.name}" added to "${eventTitle}"!`);
      return [...prevCart, { service, startDt, endDt, eventId, eventTitle }];
    });
  };

  const removeFromCart = (serviceId, eventId) => {
    setCart((prevCart) => {
      const itemToRemove = prevCart.find(
        (item) => item.service.id === serviceId && item.eventId === eventId
      );
      if (itemToRemove) {
        // Silently remove without toast
      }
      return prevCart.filter(
        (item) => !(item.service.id === serviceId && item.eventId === eventId)
      );
    });
  };

  const updateCartItemDates = (serviceId, eventId, startDt, endDt) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.service.id === serviceId && item.eventId === eventId
          ? { ...item, startDt, endDt }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('planit_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartItemDates,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
