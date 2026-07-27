export const medicines = [
  { id: 'M001', name: 'Paracetamol 500mg', code: 'PRC-500', category: 'Analgesics', manufacturer: 'PharmaCorp', batchNumber: 'B-1001', purchasePrice: 1.05, sellingPrice: 1.50, quantity: 5000, minStock: 1000, manufacturingDate: '2025-01-10', expiryDate: '2028-01-10', supplier: 'S001', storageLocation: 'A-1', status: 'Active' },
  { id: 'M002', name: 'Amoxicillin 250mg', code: 'AMX-250', category: 'Antibiotics', manufacturer: 'HealthPlus', batchNumber: 'B-2051', purchasePrice: 1.54, sellingPrice: 2.20, quantity: 1500, minStock: 500, manufacturingDate: '2025-03-15', expiryDate: '2027-03-15', supplier: 'S002', storageLocation: 'B-3', status: 'Active' },
  { id: 'M003', name: 'Ibuprofen 400mg', code: 'IBU-400', category: 'Analgesics', manufacturer: 'MediLife', batchNumber: 'B-1022', purchasePrice: 1.26, sellingPrice: 1.80, quantity: 450, minStock: 500, manufacturingDate: '2024-11-20', expiryDate: '2026-11-20', supplier: 'S001', storageLocation: 'A-2', status: 'Active' },
  { id: 'M004', name: 'Azithromycin 500mg', code: 'AZI-500', category: 'Antibiotics', manufacturer: 'PharmaCorp', batchNumber: 'B-3001', purchasePrice: 3.50, sellingPrice: 5.00, quantity: 2000, minStock: 400, manufacturingDate: '2025-05-01', expiryDate: '2028-05-01', supplier: 'S003', storageLocation: 'C-1', status: 'Active' },
  { id: 'M005', name: 'Metformin 500mg', code: 'MET-500', category: 'Antidiabetic', manufacturer: 'DiabetCare', batchNumber: 'B-4005', purchasePrice: 0.84, sellingPrice: 1.20, quantity: 3000, minStock: 800, manufacturingDate: '2025-02-10', expiryDate: '2027-02-10', supplier: 'S004', storageLocation: 'D-1', status: 'Active' },
  { id: 'M006', name: 'Lisinopril 10mg', code: 'LIS-010', category: 'Cardiovascular', manufacturer: 'HeartHealth', batchNumber: 'B-5010', purchasePrice: 2.45, sellingPrice: 3.50, quantity: 1200, minStock: 300, manufacturingDate: '2024-12-05', expiryDate: '2026-12-05', supplier: 'S005', storageLocation: 'E-2', status: 'Active' },
  { id: 'M007', name: 'Atorvastatin 20mg', code: 'ATO-020', category: 'Cardiovascular', manufacturer: 'HeartHealth', batchNumber: 'B-5020', purchasePrice: 2.87, sellingPrice: 4.10, quantity: 2500, minStock: 600, manufacturingDate: '2025-04-12', expiryDate: '2028-04-12', supplier: 'S005', storageLocation: 'E-3', status: 'Active' },
  { id: 'M008', name: 'Vitamin C 1000mg', code: 'VIT-C1K', category: 'Vitamins', manufacturer: 'NutriWell', batchNumber: 'B-6001', purchasePrice: 0.35, sellingPrice: 0.50, quantity: 8000, minStock: 2000, manufacturingDate: '2025-01-20', expiryDate: '2027-01-20', supplier: 'S006', storageLocation: 'F-1', status: 'Active' },
  { id: 'M009', name: 'Vitamin D3 2000IU', code: 'VIT-D3', category: 'Vitamins', manufacturer: 'NutriWell', batchNumber: 'B-6002', purchasePrice: 0.56, sellingPrice: 0.80, quantity: 6000, minStock: 1500, manufacturingDate: '2025-03-10', expiryDate: '2027-03-10', supplier: 'S006', storageLocation: 'F-2', status: 'Active' },
  { id: 'M010', name: 'Salbutamol Inhaler', code: 'SAL-INH', category: 'Respiratory', manufacturer: 'BreatheEasy', batchNumber: 'B-7001', purchasePrice: 8.40, sellingPrice: 12.00, quantity: 800, minStock: 200, manufacturingDate: '2025-02-15', expiryDate: '2027-02-15', supplier: 'S007', storageLocation: 'G-1', status: 'Active' },
  { id: 'M011', name: 'Fluconazole 150mg', code: 'FLU-150', category: 'Antifungal', manufacturer: 'HealthPlus', batchNumber: 'B-8001', purchasePrice: 1.75, sellingPrice: 2.50, quantity: 400, minStock: 100, manufacturingDate: '2024-10-10', expiryDate: '2026-10-10', supplier: 'S002', storageLocation: 'H-1', status: 'Active' },
  { id: 'M012', name: 'Acyclovir 400mg', code: 'ACY-400', category: 'Antiviral', manufacturer: 'PharmaCorp', batchNumber: 'B-9001', purchasePrice: 3.36, sellingPrice: 4.80, quantity: 600, minStock: 150, manufacturingDate: '2025-01-05', expiryDate: '2027-01-05', supplier: 'S003', storageLocation: 'I-1', status: 'Active' },
  { id: 'M013', name: 'Omeprazole 20mg', code: 'OME-020', category: 'Gastrointestinal', manufacturer: 'GastroCare', batchNumber: 'B-1002', purchasePrice: 0.77, sellingPrice: 1.10, quantity: 3500, minStock: 1000, manufacturingDate: '2025-05-10', expiryDate: '2028-05-10', supplier: 'S008', storageLocation: 'J-1', status: 'Active' },
  { id: 'M014', name: 'Pantoprazole 40mg', code: 'PAN-040', category: 'Gastrointestinal', manufacturer: 'GastroCare', batchNumber: 'B-1003', purchasePrice: 0.98, sellingPrice: 1.40, quantity: 2800, minStock: 800, manufacturingDate: '2025-04-20', expiryDate: '2027-04-20', supplier: 'S008', storageLocation: 'J-2', status: 'Active' },
  { id: 'M015', name: 'Diclofenac 50mg', code: 'DIC-050', category: 'Analgesics', manufacturer: 'MediLife', batchNumber: 'B-1033', purchasePrice: 0.63, sellingPrice: 0.90, quantity: 1800, minStock: 400, manufacturingDate: '2024-12-15', expiryDate: '2026-12-15', supplier: 'S001', storageLocation: 'A-3', status: 'Active' },
  { id: 'M016', name: 'Ciprofloxacin 500mg', code: 'CIP-500', category: 'Antibiotics', manufacturer: 'HealthPlus', batchNumber: 'B-2066', purchasePrice: 2.24, sellingPrice: 3.20, quantity: 1200, minStock: 300, manufacturingDate: '2025-06-01', expiryDate: '2028-06-01', supplier: 'S002', storageLocation: 'B-4', status: 'Active' },
  { id: 'M017', name: 'Losartan 50mg', code: 'LOS-050', category: 'Cardiovascular', manufacturer: 'HeartHealth', batchNumber: 'B-5030', purchasePrice: 1.96, sellingPrice: 2.80, quantity: 2200, minStock: 500, manufacturingDate: '2025-03-25', expiryDate: '2027-03-25', supplier: 'S005', storageLocation: 'E-4', status: 'Active' },
  { id: 'M018', name: 'Glimepiride 2mg', code: 'GLI-002', category: 'Antidiabetic', manufacturer: 'DiabetCare', batchNumber: 'B-4015', purchasePrice: 1.12, sellingPrice: 1.60, quantity: 1900, minStock: 400, manufacturingDate: '2025-01-30', expiryDate: '2027-01-30', supplier: 'S004', storageLocation: 'D-2', status: 'Active' },
  { id: 'M019', name: 'B-Complex', code: 'VIT-BCM', category: 'Vitamins', manufacturer: 'NutriWell', batchNumber: 'B-6003', purchasePrice: 0.70, sellingPrice: 1.00, quantity: 4500, minStock: 1000, manufacturingDate: '2025-04-15', expiryDate: '2027-04-15', supplier: 'S006', storageLocation: 'F-3', status: 'Active' },
  { id: 'M020', name: 'Budesonide Inhaler', code: 'BUD-INH', category: 'Respiratory', manufacturer: 'BreatheEasy', batchNumber: 'B-7002', purchasePrice: 12.60, sellingPrice: 18.00, quantity: 600, minStock: 150, manufacturingDate: '2025-03-05', expiryDate: '2027-03-05', supplier: 'S007', storageLocation: 'G-2', status: 'Active' },
  { id: 'M021', name: 'Expired Med X', code: 'EXP-001', category: 'Analgesics', manufacturer: 'OldPharma', batchNumber: 'B-0001', purchasePrice: 0.70, sellingPrice: 1.00, quantity: 100, minStock: 50, manufacturingDate: '2020-01-01', expiryDate: '2022-01-01', supplier: 'S001', storageLocation: 'Z-9', status: 'Expired' },
];

export const suppliers = [
  { id: 'S001', name: 'MediLife Supplies', phone: '123-456-7890', email: 'contact@medilife.com', address: '123 Health Ave', suppliedMedicines: 15, status: 'Active', rating: 4.8, totalOrders: 120 },
  { id: 'S002', name: 'HealthPlus Logistics', phone: '987-654-3210', email: 'sales@healthplus.com', address: '456 Wellness Blvd', suppliedMedicines: 8, status: 'Active', rating: 4.5, totalOrders: 85 },
  { id: 'S003', name: 'PharmaCorp Direct', phone: '555-123-4567', email: 'orders@pharmacorp.com', address: '789 Cure St', suppliedMedicines: 22, status: 'Active', rating: 4.9, totalOrders: 210 },
  { id: 'S004', name: 'DiabetCare Partners', phone: '222-333-4444', email: 'info@diabetcare.com', address: '101 Sugar Free Ln', suppliedMedicines: 5, status: 'Active', rating: 4.6, totalOrders: 60 },
  { id: 'S005', name: 'HeartHealth Dist', phone: '444-555-6666', email: 'support@hearthealth.com', address: '202 Cardio Way', suppliedMedicines: 12, status: 'Active', rating: 4.7, totalOrders: 150 },
  { id: 'S006', name: 'NutriWell Source', phone: '777-888-9999', email: 'hello@nutriwell.com', address: '303 Vitamin Dr', suppliedMedicines: 18, status: 'Active', rating: 4.4, totalOrders: 110 },
  { id: 'S007', name: 'BreatheEasy Supplies', phone: '666-777-8888', email: 'sales@breatheeasy.com', address: '404 Lung Rd', suppliedMedicines: 6, status: 'Active', rating: 4.8, totalOrders: 75 },
  { id: 'S008', name: 'GastroCare Meds', phone: '888-999-0000', email: 'contact@gastrocare.com', address: '505 Digestion Ct', suppliedMedicines: 9, status: 'Inactive', rating: 3.5, totalOrders: 40 },
];

export const purchaseOrders = [
  { id: 'PO-1001', medicine: 'Ibuprofen 400mg', supplier: 'MediLife Supplies', quantity: 2000, expectedCost: 3600.00, status: 'Pending', priority: 'High', orderDate: '2026-07-20', expectedDelivery: '2026-07-25' },
  { id: 'PO-1002', medicine: 'Amoxicillin 250mg', supplier: 'HealthPlus Logistics', quantity: 1000, expectedCost: 2200.00, status: 'Delivered', priority: 'Medium', orderDate: '2026-07-15', expectedDelivery: '2026-07-18' },
  { id: 'PO-1003', medicine: 'Lisinopril 10mg', supplier: 'HeartHealth Dist', quantity: 500, expectedCost: 1750.00, status: 'In Transit', priority: 'Low', orderDate: '2026-07-21', expectedDelivery: '2026-07-28' },
  { id: 'PO-1004', medicine: 'Vitamin C 1000mg', supplier: 'NutriWell Source', quantity: 5000, expectedCost: 2500.00, status: 'Pending', priority: 'Medium', orderDate: '2026-07-22', expectedDelivery: '2026-07-29' },
  { id: 'PO-1005', medicine: 'Azithromycin 500mg', supplier: 'PharmaCorp Direct', quantity: 1500, expectedCost: 7500.00, status: 'Delivered', priority: 'High', orderDate: '2026-07-10', expectedDelivery: '2026-07-14' },
  { id: 'PO-1006', medicine: 'Metformin 500mg', supplier: 'DiabetCare Partners', quantity: 2000, expectedCost: 2400.00, status: 'In Transit', priority: 'Medium', orderDate: '2026-07-23', expectedDelivery: '2026-07-26' },
  { id: 'PO-1007', medicine: 'Salbutamol Inhaler', supplier: 'BreatheEasy Supplies', quantity: 300, expectedCost: 3600.00, status: 'Pending', priority: 'High', orderDate: '2026-07-24', expectedDelivery: '2026-07-30' },
  { id: 'PO-1008', medicine: 'Omeprazole 20mg', supplier: 'GastroCare Meds', quantity: 1000, expectedCost: 1100.00, status: 'Cancelled', priority: 'Low', orderDate: '2026-07-05', expectedDelivery: '2026-07-15' },
  { id: 'PO-1009', medicine: 'Fluconazole 150mg', supplier: 'HealthPlus Logistics', quantity: 200, expectedCost: 500.00, status: 'Delivered', priority: 'Medium', orderDate: '2026-07-18', expectedDelivery: '2026-07-22' },
  { id: 'PO-1010', medicine: 'Paracetamol 500mg', supplier: 'MediLife Supplies', quantity: 5000, expectedCost: 7500.00, status: 'In Transit', priority: 'Low', orderDate: '2026-07-22', expectedDelivery: '2026-08-01' },
];

export const inventoryHistory = [
  { id: 'H001', medicine: 'Paracetamol 500mg', action: 'Stock Added', quantity: 1000, date: '2026-07-20T10:30:00Z', user: 'Dr. Smith', notes: 'Monthly refill' },
  { id: 'H002', medicine: 'Ibuprofen 400mg', action: 'Dispensed', quantity: -50, date: '2026-07-21T09:15:00Z', user: 'Nurse Joy', notes: 'Ward A supply' },
  { id: 'H003', medicine: 'Amoxicillin 250mg', action: 'Stock Added', quantity: 500, date: '2026-07-18T14:20:00Z', user: 'Admin', notes: 'Emergency PO received' },
  { id: 'H004', medicine: 'Lisinopril 10mg', action: 'Dispensed', quantity: -20, date: '2026-07-22T11:45:00Z', user: 'Pharmacist Lee', notes: 'Outpatient prescription' },
  { id: 'H005', medicine: 'Vitamin C 1000mg', action: 'Stock Adjusted', quantity: -10, date: '2026-07-23T16:00:00Z', user: 'Admin', notes: 'Damaged stock removed' },
  { id: 'H006', medicine: 'Azithromycin 500mg', action: 'Stock Added', quantity: 1500, date: '2026-07-14T08:30:00Z', user: 'Dr. Smith', notes: 'PO-1005 received' },
  { id: 'H007', medicine: 'Metformin 500mg', action: 'Dispensed', quantity: -100, date: '2026-07-24T09:00:00Z', user: 'Nurse Joy', notes: 'Ward B supply' },
  { id: 'H008', medicine: 'Salbutamol Inhaler', action: 'Dispensed', quantity: -5, date: '2026-07-23T13:20:00Z', user: 'Pharmacist Lee', notes: 'Emergency Ward' },
  { id: 'H009', medicine: 'Omeprazole 20mg', action: 'Dispensed', quantity: -30, date: '2026-07-22T10:10:00Z', user: 'Dr. Smith', notes: 'Outpatient' },
  { id: 'H010', medicine: 'Fluconazole 150mg', action: 'Stock Added', quantity: 200, date: '2026-07-22T15:40:00Z', user: 'Admin', notes: 'PO-1009 received' },
  { id: 'H011', medicine: 'Paracetamol 500mg', action: 'Dispensed', quantity: -200, date: '2026-07-24T08:00:00Z', user: 'Nurse Joy', notes: 'General Ward supply' },
  { id: 'H012', medicine: 'Vitamin D3 2000IU', action: 'Stock Added', quantity: 1000, date: '2026-07-10T11:00:00Z', user: 'Admin', notes: 'Monthly refill' },
  { id: 'H013', medicine: 'Atorvastatin 20mg', action: 'Dispensed', quantity: -45, date: '2026-07-21T14:30:00Z', user: 'Pharmacist Lee', notes: 'Outpatient' },
  { id: 'H014', medicine: 'Diclofenac 50mg', action: 'Stock Adjusted', quantity: -5, date: '2026-07-19T09:45:00Z', user: 'Dr. Smith', notes: 'Quality check samples' },
  { id: 'H015', medicine: 'Amoxicillin 250mg', action: 'Dispensed', quantity: -120, date: '2026-07-24T12:00:00Z', user: 'Nurse Joy', notes: 'Ward C supply' },
];

export const forecastData = [
  { medicineId: 'M001', medicineName: 'Paracetamol 500mg', predictedDemand: 1200, confidenceScore: 92, nextMonthTrend: 'Up', recommendedAction: 'Order 5000 units by next week.' },
  { medicineId: 'M003', medicineName: 'Ibuprofen 400mg', predictedDemand: 800, confidenceScore: 85, nextMonthTrend: 'Stable', recommendedAction: 'Monitor stock. Reorder if drops below 500.' },
  { medicineId: 'M010', medicineName: 'Salbutamol Inhaler', predictedDemand: 400, confidenceScore: 95, nextMonthTrend: 'Up', recommendedAction: 'Seasonal spike expected. Order 300 units immediately.' },
  { medicineId: 'M004', medicineName: 'Azithromycin 500mg', predictedDemand: 600, confidenceScore: 88, nextMonthTrend: 'Down', recommendedAction: 'Stock sufficient for next 3 months.' },
];

// Near expiry medicines (within 60 days from now)
export const nearExpiryData = [
  { id: 'NE001', name: 'Ibuprofen 400mg', code: 'IBU-400', category: 'Analgesics', batchNumber: 'B-1022', expiryDate: '2026-07-30', quantity: 450, daysLeft: 6, storageLocation: 'A-2', status: 'Critical' },
  { id: 'NE002', name: 'Diclofenac 50mg', code: 'DIC-050', category: 'Analgesics', batchNumber: 'B-1033', expiryDate: '2026-08-10', quantity: 1800, daysLeft: 17, storageLocation: 'A-3', status: 'Warning' },
  { id: 'NE003', name: 'Fluconazole 150mg', code: 'FLU-150', category: 'Antifungal', batchNumber: 'B-8001', expiryDate: '2026-08-24', quantity: 400, daysLeft: 31, storageLocation: 'H-1', status: 'Watch' },
  { id: 'NE004', name: 'Lisinopril 10mg', code: 'LIS-010', category: 'Cardiovascular', batchNumber: 'B-5010', expiryDate: '2026-08-28', quantity: 1200, daysLeft: 35, storageLocation: 'E-2', status: 'Watch' },
  { id: 'NE005', name: 'Acyclovir 400mg', code: 'ACY-400', category: 'Antiviral', batchNumber: 'B-9001', expiryDate: '2026-09-05', quantity: 600, daysLeft: 43, storageLocation: 'I-1', status: 'Watch' },
  { id: 'NE006', name: 'B-Complex', code: 'VIT-BCM', category: 'Vitamins', batchNumber: 'B-6003', expiryDate: '2026-09-15', quantity: 4500, daysLeft: 53, storageLocation: 'F-3', status: 'Monitor' },
];

// Expired medicines
export const expiredMedicines = [
  { id: 'EXP001', name: 'Expired Med X', code: 'EXP-001', category: 'Analgesics', batchNumber: 'B-0001', expiryDate: '2022-01-01', quantity: 100, storageLocation: 'Z-9', disposalStatus: 'Pending', discoveredDate: '2026-07-10' },
  { id: 'EXP002', name: 'OldVitamin A 5000IU', code: 'VITA-500', category: 'Vitamins', batchNumber: 'B-0002', expiryDate: '2023-06-15', quantity: 250, storageLocation: 'Z-8', disposalStatus: 'Pending', discoveredDate: '2026-07-15' },
  { id: 'EXP003', name: 'Aspirin 75mg Batch2021', code: 'ASP-075', category: 'Analgesics', batchNumber: 'B-0003', expiryDate: '2024-03-20', quantity: 80, storageLocation: 'Z-7', disposalStatus: 'Disposed', discoveredDate: '2026-06-01' },
];

// Stock history (alias for inventoryHistory with extended data)
export const stockHistory = [
  { id: 'SH001', medicine: 'Paracetamol 500mg', medicineCode: 'PRC-500', action: 'Added', quantity: 1000, previousStock: 4000, newStock: 5000, date: '2026-07-20T10:30:00Z', user: 'Dr. Smith', notes: 'Monthly refill', batchNumber: 'B-1001' },
  { id: 'SH002', medicine: 'Ibuprofen 400mg', medicineCode: 'IBU-400', action: 'Dispensed', quantity: 50, previousStock: 500, newStock: 450, date: '2026-07-21T09:15:00Z', user: 'Nurse Joy', notes: 'Ward A supply', batchNumber: 'B-1022' },
  { id: 'SH003', medicine: 'Amoxicillin 250mg', medicineCode: 'AMX-250', action: 'Added', quantity: 500, previousStock: 1000, newStock: 1500, date: '2026-07-18T14:20:00Z', user: 'Admin', notes: 'Emergency PO received', batchNumber: 'B-2051' },
  { id: 'SH004', medicine: 'Lisinopril 10mg', medicineCode: 'LIS-010', action: 'Dispensed', quantity: 20, previousStock: 1220, newStock: 1200, date: '2026-07-22T11:45:00Z', user: 'Pharmacist Lee', notes: 'Outpatient prescription', batchNumber: 'B-5010' },
  { id: 'SH005', medicine: 'Vitamin C 1000mg', medicineCode: 'VIT-C1K', action: 'Adjusted', quantity: 10, previousStock: 8010, newStock: 8000, date: '2026-07-23T16:00:00Z', user: 'Admin', notes: 'Damaged stock removed', batchNumber: 'B-6001' },
  { id: 'SH006', medicine: 'Azithromycin 500mg', medicineCode: 'AZI-500', action: 'Added', quantity: 1500, previousStock: 500, newStock: 2000, date: '2026-07-14T08:30:00Z', user: 'Dr. Smith', notes: 'PO-1005 received', batchNumber: 'B-3001' },
  { id: 'SH007', medicine: 'Metformin 500mg', medicineCode: 'MET-500', action: 'Dispensed', quantity: 100, previousStock: 3100, newStock: 3000, date: '2026-07-24T09:00:00Z', user: 'Nurse Joy', notes: 'Ward B supply', batchNumber: 'B-4005' },
  { id: 'SH008', medicine: 'Salbutamol Inhaler', medicineCode: 'SAL-INH', action: 'Dispensed', quantity: 5, previousStock: 805, newStock: 800, date: '2026-07-23T13:20:00Z', user: 'Pharmacist Lee', notes: 'Emergency Ward', batchNumber: 'B-7001' },
  { id: 'SH009', medicine: 'Omeprazole 20mg', medicineCode: 'OME-020', action: 'Dispensed', quantity: 30, previousStock: 3530, newStock: 3500, date: '2026-07-22T10:10:00Z', user: 'Dr. Smith', notes: 'Outpatient', batchNumber: 'B-1002' },
  { id: 'SH010', medicine: 'Fluconazole 150mg', medicineCode: 'FLU-150', action: 'Added', quantity: 200, previousStock: 200, newStock: 400, date: '2026-07-22T15:40:00Z', user: 'Admin', notes: 'PO-1009 received', batchNumber: 'B-8001' },
  { id: 'SH011', medicine: 'Paracetamol 500mg', medicineCode: 'PRC-500', action: 'Dispensed', quantity: 200, previousStock: 5200, newStock: 5000, date: '2026-07-24T08:00:00Z', user: 'Nurse Joy', notes: 'General Ward supply', batchNumber: 'B-1001' },
  { id: 'SH012', medicine: 'Vitamin D3 2000IU', medicineCode: 'VIT-D3', action: 'Added', quantity: 1000, previousStock: 5000, newStock: 6000, date: '2026-07-10T11:00:00Z', user: 'Admin', notes: 'Monthly refill', batchNumber: 'B-6002' },
  { id: 'SH013', medicine: 'Atorvastatin 20mg', medicineCode: 'ATO-020', action: 'Dispensed', quantity: 45, previousStock: 2545, newStock: 2500, date: '2026-07-21T14:30:00Z', user: 'Pharmacist Lee', notes: 'Outpatient', batchNumber: 'B-5020' },
  { id: 'SH014', medicine: 'Diclofenac 50mg', medicineCode: 'DIC-050', action: 'Adjusted', quantity: 5, previousStock: 1805, newStock: 1800, date: '2026-07-19T09:45:00Z', user: 'Dr. Smith', notes: 'Quality check samples', batchNumber: 'B-1033' },
  { id: 'SH015', medicine: 'Amoxicillin 250mg', medicineCode: 'AMX-250', action: 'Dispensed', quantity: 120, previousStock: 1620, newStock: 1500, date: '2026-07-24T12:00:00Z', user: 'Nurse Joy', notes: 'Ward C supply', batchNumber: 'B-2051' },
];
