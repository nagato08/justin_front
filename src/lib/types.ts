export type UserRole = "ADMIN" | "DELIVERER" | "CUSTOMER";
export interface User { id: string; email: string; displayName: string; role: UserRole }
export interface AuthResponse { accessToken: string; expiresIn: string; user: User }
export interface ProductImage { id: string; url: string; sortOrder: number }
export interface Product { id: string; categoryId: string; name: string; slug: string; description?: string; price: string; imageUrl?: string; images?: ProductImage[]; portions: number; status: string; category?: Category; createdAt?: string; updatedAt?: string }
export interface Category { id: string; name: string; slug: string; isActive: boolean; products: Product[]; _count?: { products: number } }
export interface StoreStatus { businessName: string; isOpen: boolean; reason: string; message: string; mobileMoneyEnabled: boolean; nextOpeningAt?: string | null }
export interface CartLine { product: Product; quantity: number }
export interface Payment { id: string; method: "CASH" | "MOBILE_MONEY"; status: string; amount: string; currency: string; paidAt?: string }
export interface OrderItem { id?: string; productName: string; quantity: number; unitPrice: string; lineTotal: string }
export interface Order { id: string; reference: string; status: string; fulfillmentType: "DELIVERY" | "PICKUP"; customerName: string; customerPhone: string; deliveryAddress?: string; deliveryLatitude?: string; deliveryLongitude?: string; subtotal: string; deliveryFee: string; total: string; requestedFor?: string; createdAt: string; updatedAt: string; items: OrderItem[]; payments: Payment[] }
export interface DashboardData { orders: { total: number; activeTotal: number; byStatus: Record<string, number>; grossValue: string; deliveryFees: string; averageValue: string }; payments: { receivedCount: number; receivedAmount: string }; popularProducts: Array<{ name: string; quantity: number; amount: string }> }
export interface DeliveryLocation { latitude: string; longitude: string; accuracy?: number; heading?: number; speed?: number; recordedAt: string }
export interface DeliveryTracking { assignmentId: string; status: string; stopSequence: number; stopsBefore: number; latestLocation: DeliveryLocation | null }
