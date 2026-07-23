import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Employee full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Employee email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Employee phone number is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['Agent', 'Admin'],
      default: 'Agent',
    },
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: 0,
    },
    department: {
      type: String,
      default: 'Field Operations',
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Terminated'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
