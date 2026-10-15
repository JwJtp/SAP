export type OrderStatus = 'draft' | 'validated' | 'created' | 'completed'

export type TabId = 'sales' | 'items' | 'detail' | 'ordering' | 'procurement'

export type NavId = 'home' | 'sales-orders' | 'create' | 'manage-orders' | 'customers' | 'materials' | 'reports' | 'settings'

export interface Customer {
  id: string
  name: string
  location: string
  segment: string
}

export interface MaterialCatalogItem {
  id: string
  description: string
  defaultUnit: string
  defaultPrice: number
  color: string
}

export interface OrderItem {
  id: string
  itemNumber: number
  materialNumber: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  selected: boolean
}

export interface OrderForm {
  soldTo: string
  shipTo: string
  purchaseOrderNumber: string
  purchaseOrderDate: string
  documentDate: string
  currency: string
  incoterms: string
  salesArea: string
  pricingProcedure: string
}

export interface ToastMessage {
  id: number
  tone: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

export interface ValidationErrors {
  [key: string]: string | undefined
}

export interface Totals {
  subtotal: number
  discount: number
  tax: number
  total: number
  itemCount: number
}
