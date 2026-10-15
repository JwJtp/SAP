import type { OrderForm, OrderItem, Totals, ValidationErrors } from '../types'

export const DEMO_TAX_RATE = 0.18

export const formatCurrency = (value: number, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `₹${value.toFixed(2)}`
  }
}

export const lineAmount = (item: OrderItem) => Math.max(0, item.quantity) * Math.max(0, item.unitPrice)

export const calculateTotals = (items: OrderItem[]): Totals => {
  const subtotal = items.reduce((sum, item) => sum + lineAmount(item), 0)
  const discount = 0
  const tax = (subtotal - discount) * DEMO_TAX_RATE
  return { subtotal, discount, tax, total: subtotal - discount + tax, itemCount: items.length }
}

export const validateOrder = (form: OrderForm, items: OrderItem[]): ValidationErrors => {
  const errors: ValidationErrors = {}
  if (!form.soldTo) errors.soldTo = 'Select a sold-to party.'
  if (!form.shipTo) errors.shipTo = 'Select a ship-to party.'
  if (!form.purchaseOrderNumber.trim()) errors.purchaseOrderNumber = 'Purchase order number is required.'
  if (!form.purchaseOrderDate) errors.purchaseOrderDate = 'Purchase order date is required.'
  if (!form.documentDate) errors.documentDate = 'Document date is required.'
  if (!items.length) errors.items = 'Add at least one scrap material.'
  items.forEach((item) => {
    if (!item.materialNumber) errors[`item-${item.id}`] = 'Material is required.'
    else if (item.quantity <= 0) errors[`item-${item.id}`] = 'Quantity must be greater than zero.'
    else if (item.unitPrice < 0) errors[`item-${item.id}`] = 'Unit price cannot be negative.'
  })
  return errors
}
