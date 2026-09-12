import { Schema, model } from "mongoose";

const ReportSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    reporterEmail: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Copyright/IP",
        "Misleading listing",
        "Inappropriate content",
        "Fraud/suspicious activity",
        "Incorrect condition",
        "Other",
      ],
    },
    details: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default model("report", ReportSchema);
