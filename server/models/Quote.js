import mongoose from "mongoose";

const quoteItemSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            default: null,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
    },
    { _id: false }
);

const quoteSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        customerName: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        customerPhone: {
            type: String,
            trim: true,
            maxlength: 30,
            default: "",
        },
        quoteNumber: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["draft", "sent", "converted"],
            default: "draft",
        },
        items: {
            type: [quoteItemSchema],
            default: [],
        },
        total: {
            type: Number,
            min: 0,
            default: 0,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
        convertedAt: {
            type: Date,
            default: null,
        },
        convertedAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

    },

    {
        timestamps: true,
    }
);

const Quote = mongoose.model("Quote", quoteSchema);

export default Quote;