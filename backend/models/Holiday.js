import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Holiday date is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Holiday', 'Skip'],
      default: 'Holiday',
    },
    // Optional: restrict skip to a specific field route / center
    routeId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to efficiently query holidays by date range
holidaySchema.index({ date: 1 });

const Holiday = mongoose.model('Holiday', holidaySchema);
export default Holiday;
