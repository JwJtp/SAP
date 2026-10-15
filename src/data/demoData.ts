import type { Customer, MaterialCatalogItem, OrderForm, OrderItem } from '../types'

export const demoCustomers: Customer[] = [
  { id: '100028', name: 'Apex Metal Works Pvt. Ltd.', location: 'Pune, Maharashtra', segment: 'Industrial buyer' },
  { id: '100044', name: 'GreenLoop Manufacturing', location: 'Nashik, Maharashtra', segment: 'Recycling partner' },
  { id: '100071', name: 'Kaveri Engineering Co.', location: 'Bengaluru, Karnataka', segment: 'Fabrication' },
  { id: '100096', name: 'Northstar Components', location: 'Gurugram, Haryana', segment: 'OEM supplier' },
]

export const demoMaterials: MaterialCatalogItem[] = [
  { id: 'SCRAP001', description: 'MS Scrap', defaultUnit: 'KG', defaultPrice: 20, color: 'blue' },
  { id: 'SCRAP002', description: 'Aluminium Scrap', defaultUnit: 'KG', defaultPrice: 45, color: 'cyan' },
  { id: 'SCRAP003', description: 'Copper Scrap', defaultUnit: 'KG', defaultPrice: 380, color: 'orange' },
  { id: 'SCRAP004', description: 'Iron Scrap', defaultUnit: 'KG', defaultPrice: 25, color: 'green' },
  { id: 'SCRAP005', description: 'Stainless Steel Scrap', defaultUnit: 'KG', defaultPrice: 92, color: 'purple' },
]

export const initialForm: OrderForm = {
  soldTo: '100028',
  shipTo: '100028',
  purchaseOrderNumber: 'PO-24780',
  purchaseOrderDate: '2026-10-14',
  documentDate: '2026-10-15',
  currency: 'INR',
  incoterms: 'EXW',
  salesArea: '1000 / 10 / 10',
  pricingProcedure: 'V10000',
}

export const initialItems: OrderItem[] = [
  { id: 'item-10', itemNumber: 10, materialNumber: 'SCRAP001', description: 'MS Scrap', quantity: 500, unit: 'KG', unitPrice: 20, selected: false },
  { id: 'item-20', itemNumber: 20, materialNumber: 'SCRAP002', description: 'Aluminium Scrap', quantity: 300, unit: 'KG', unitPrice: 45, selected: false },
  { id: 'item-30', itemNumber: 30, materialNumber: 'SCRAP003', description: 'Copper Scrap', quantity: 200, unit: 'KG', unitPrice: 380, selected: false },
  { id: 'item-40', itemNumber: 40, materialNumber: 'SCRAP004', description: 'Iron Scrap', quantity: 400, unit: 'KG', unitPrice: 25, selected: false },
]

export const orgData = [
  { label: 'Sales Organization', code: '1000', description: 'India Sales' },
  { label: 'Distribution Channel', code: '10', description: 'Direct sales' },
  { label: 'Division', code: '10', description: 'Industrial materials' },
  { label: 'Sales Office', code: '1300', description: 'Pune office' },
  { label: 'Sales Group', code: '100', description: 'Scrap trading' },
]
