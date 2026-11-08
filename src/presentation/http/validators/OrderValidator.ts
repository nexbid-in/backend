import { z } from "zod";
import { OrderSide, OrderType, ProductType, OrderStatus } from "../../../domain/entities/trading/Order";

export const placeOrderSchema = z
  .object({
    symbol: z.string().trim().min(1, "Stock symbol is required"),
    side: z.nativeEnum(OrderSide, { message: "Side must be BUY or SELL" }),
    orderType: z.nativeEnum(OrderType, { message: "Invalid order type" }),
    productType: z.nativeEnum(ProductType, { message: "Product must be CNC or MIS" }),
    quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
    price: z.coerce.number().positive("Price must be greater than zero").optional().nullable(),
    triggerPrice: z.coerce.number().positive("Trigger price must be greater than zero").optional().nullable(),
    isAmo: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.orderType === OrderType.LIMIT) {
        return typeof data.price === "number" && data.price > 0;
      }
      return true;
    },
    { message: "Limit orders require a valid price greater than 0", path: ["price"] }
  );

export const getOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
});

export const cancelOrderParamsSchema = z.object({
  id: z.string().uuid("Invalid order ID format"),
});

export const getPositionsQuerySchema = z.object({
  filter: z.enum(["OPEN", "ALL"]).default("ALL"),
});

export const squareOffParamsSchema = z.object({
  id: z.string().uuid("Invalid position ID format"),
});
