import mongoose from "mongoose";

const cropYieldSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cropName: { type: String, required: true },
    quantityQuintals: { type: Number, required: true },
    harvestDate: { type: Date },
    qualityGrade: { type: String, enum: ["A", "B", "C"], default: "A" },
    status: {
      type: String,
      enum: ["pending", "listed", "sold"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CropYield", cropYieldSchema);
