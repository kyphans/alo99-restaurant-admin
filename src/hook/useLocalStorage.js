'use client';
import { useState, useEffect } from "react";

export const useLocalStorage = (keyName, defaultValue = {}) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const value = window.localStorage.getItem(keyName);
      if (value) {
        return JSON.parse(value);
      }
      return defaultValue;
    }
    return defaultValue;
  });

  const setValue = (newValue) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(keyName, JSON.stringify(newValue));
      }
    } catch (err) {
      // Handle error if needed
    }
    setStoredValue(newValue);
  };

  return [storedValue, setValue];
};
