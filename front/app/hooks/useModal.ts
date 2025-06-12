// hooks/useModal.ts
import { useState } from 'react';

export const useModal = <T>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const openModal = (data: T) => {
    setData(data);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setData(null);
  };

  return {
    isOpen,
    data,
    openModal,
    closeModal,
  };
};
