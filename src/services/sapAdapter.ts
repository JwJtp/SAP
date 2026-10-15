import type { Customer, MaterialCatalogItem, OrderForm, OrderItem } from '../types'
import { demoCustomers, demoMaterials } from '../data/demoData'

export interface SapOrderDraft {
  form: OrderForm
  items: OrderItem[]
}

export interface SapOperationResult {
  ok: boolean
  reference?: string
  message: string
}

/**
 * Demonstration adapter. Replace these methods with authenticated SAP API/OData calls.
 * Production behavior must preserve SAP pricing, tax, authorization and validation rules.
 */
export const sapAdapter = {
  async searchCustomers(query: string): Promise<Customer[]> {
    await wait(260)
    const normalized = query.trim().toLowerCase()
    if (!normalized) return demoCustomers.slice(0, 4)
    return demoCustomers.filter((customer) => `${customer.id} ${customer.name} ${customer.location}`.toLowerCase().includes(normalized))
  },

  async searchMaterials(query: string): Promise<MaterialCatalogItem[]> {
    await wait(220)
    const normalized = query.trim().toLowerCase()
    if (!normalized) return demoMaterials
    return demoMaterials.filter((material) => `${material.id} ${material.description}`.toLowerCase().includes(normalized))
  },

  async saveDraft(_draft: SapOrderDraft): Promise<SapOperationResult> {
    await wait(780)
    return { ok: true, reference: 'DEMO-DRAFT-001', message: 'Draft saved locally for this demonstration session.' }
  },

  async validate(_draft: SapOrderDraft): Promise<SapOperationResult> {
    await wait(940)
    return { ok: true, message: 'Demo validation passed. SAP pricing and authorization were not called.' }
  },

  async createOrder(_draft: SapOrderDraft): Promise<SapOperationResult> {
    await wait(1200)
    return { ok: true, reference: 'DEMO-ORDER-001', message: 'Demonstration order created in the mock adapter only.' }
  },
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))
