import { Hono } from 'hono'
import * as PaymentControllers from '../payments/payments.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const PaymentRoutes = new Hono()

// Get all payments
PaymentRoutes.get('/payments',  PaymentControllers.getAllPayments)

// Get payment by payment id
PaymentRoutes.get('/payments/:payment_id',  PaymentControllers.getPaymentById)

// Create a payment
PaymentRoutes.post('/payments', PaymentControllers.createPayment)

// Update payment by payment id
PaymentRoutes.put('/payments/:payment_id',  PaymentControllers.updatePayment)

// Delete payment by payment id
PaymentRoutes.delete('/payments/:payment_id',  PaymentControllers.deletePayment)

// ✅ CREATE STRIPE PAYMENT INTENT - NEW ROUTE
PaymentRoutes.post('/payments/create-intent', PaymentControllers.createStripePaymentIntent)

// ✅ CONFIRM STRIPE PAYMENT - NEW ROUTE
PaymentRoutes.post('/payments/confirm', PaymentControllers.confirmStripePayment)

export default PaymentRoutes