import mongoose, { Schema, model } from "mongoose";
import { paymentMethodEnum } from "../../common/enum/product.enum.js";

const salesSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        purchasePriceAtSale: { type: Number, required: true },
        sellingPriceAtSale: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    totalProfit: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(paymentMethodEnum),
      default: paymentMethodEnum.cash,
    },
    soldBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const salesModel = mongoose.models.Sale || mongoose.model("Sale", salesSchema);

export default salesModel;
