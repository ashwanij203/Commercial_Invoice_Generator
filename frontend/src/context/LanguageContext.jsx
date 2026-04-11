import React, { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    products: 'Products',
    customers: 'Customers',
    rate: 'Rate',
    price: 'Price',
    qty: 'Qty',
    amount: 'Amount',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    terms: 'Goods once sold will not be taken back.',
    timeOfBilling: 'Time of Billing',
    category: 'Category',
    options: 'Options',
    newInvoice: 'New Invoice',
    print: 'Print',
    paymentMode: 'Payment Mode',
    paymentStatus: 'Payment Status',
    language: 'Language',
    addMoreProducts: 'Add More Products',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search...',
    actions: 'Actions'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    invoices: 'चालान (Invoices)',
    products: 'उत्पाद (Products)',
    customers: 'ग्राहक (Customers)',
    rate: 'दर (Rate)',
    price: 'मूल्य',
    qty: 'मात्रा',
    amount: 'राशि',
    total: 'कुल',
    subtotal: 'उप-योग',
    discount: 'छूट',
    grandTotal: 'कुल योग',
    terms: 'एक बार बेचा गया माल वापस नहीं लिया जाएगा।',
    timeOfBilling: 'बिलिंग का समय',
    category: 'श्रेणी (Category)',
    options: 'विकल्प',
    newInvoice: 'नया चालान',
    print: 'प्रिंट',
    paymentMode: 'भुगतान का तरीका',
    paymentStatus: 'भुगतान की स्थिति',
    language: 'भाषा',
    addMoreProducts: 'और उत्पाद जोड़ें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    search: 'खोजें...',
    actions: 'क्रियाएँ'
  }
};

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
