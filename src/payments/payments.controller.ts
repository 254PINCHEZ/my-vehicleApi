import type { Context } from "hono";
import * as paymentService from "../payments/payments.service.ts";

// ✅ Get all payments
export const getAllPayments = async (c: Context) => {
  try {
    const payments = await paymentService.getAllPayments();
    return c.json(payments, 200);
  } catch (error: any) {
    console.error("Error fetching payments:", error.message);
    return c.json({ error: "Failed to fetch payments" }, 500);
  }
};

// ✅ Get payment by ID
export const getPaymentById = async (c: Context) => {
  const id = c.req.param("payment_id");
  if (!id) return c.json({ error: "Invalid payment ID" }, 400);

  try {
    const payment = await paymentService.getPaymentById(id);
    if (!id) return c.json({ error: "Payment not found" }, 404);
    return c.json(payment, 200);
  } catch (error: any) {
    console.error("Error fetching payment:", error.message);
    return c.json({ error: "Failed to fetch payment" }, 500);
  }
};

// ✅ Create payment
export const createPayment = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await paymentService.createPayment(data);
    return c.json({ message: result }, 201);
  } catch (error: any) {
    console.error("Error creating payment:", error.message);
    return c.json({ error: error.message || "Failed to create payment" }, 500);
  }
};

// ✅ Update payment - FIXED: Remove the truthiness check
export const updatePayment = async (c: Context) => {
  const id = c.req.param("payment_id");
  if (!id) return c.json({ error: "Invalid payment ID" }, 400);

  try {
    const data = await c.req.json();
    await paymentService.updatePayment(id, data);
    return c.json({ message: "Payment updated successfully" }, 200);
  } catch (error: any) {
    console.error("Error updating payment:", error.message);
    return c.json({ error: "Failed to update payment" }, 500);
  }
};

// ✅ Delete payment
export const deletePayment = async (c: Context) => {
  const id = c.req.param("payment_id");
  if (!id) return c.json({ error: "Invalid payment ID" }, 400);

  try {
    const result = await paymentService.deletePayment(id);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error deleting payment:", error.message);
    return c.json({ error: "Failed to delete payment" }, 500);
  }
};

// ✅ CREATE STRIPE PAYMENT INTENT - NEW FUNCTION
export const createStripePaymentIntent = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await paymentService.createStripePaymentIntent(data);
    return c.json(result, 200);
  } catch (error: any) {
    console.error("Error creating Stripe payment intent:", error.message);
    return c.json({ error: error.message || "Failed to create payment intent" }, 500);
  }
};

// ✅ CONFIRM STRIPE PAYMENT - NEW FUNCTION
export const confirmStripePayment = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await paymentService.confirmStripePayment(data);
    return c.json({ 
      message: "Payment confirmed and booking created successfully",
      ...result 
    }, 200);
  } catch (error: any) {
    console.error("Error confirming Stripe payment:", error.message);
    return c.json({ error: error.message || "Failed to confirm payment" }, 500);
  }
};