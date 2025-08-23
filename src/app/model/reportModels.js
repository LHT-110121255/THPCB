// models/reportModels.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/** Report **/
const reportSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  inputDefinition: { type: Schema.Types.ObjectId, ref: 'InputDefinition' },
  outputDefinition: { type: Schema.Types.ObjectId, ref: 'OutputDefinition' },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);


/** InputDefinition **/
const allowedInputFieldTypes = [
  'text', 'number', 'date', 'boolean', 'select', 'multi-select',
  'email', 'phone', 'textarea', 'rating', 'currency', 'percent',
  'file', 'url', 'time', 'color', 'grade', 'attendance'
];

const inputFieldSchema = new Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, required: true, enum: allowedInputFieldTypes },
  required: { type: Boolean, default: false },
  options: [{ type: String }],  // chỉ dùng khi fieldType = 'select' hoặc 'multi-select'
  description: { type: String, default: '' },
});

const inputDefinitionSchema = new Schema({
  report: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  fields: {
    type: [inputFieldSchema],
    validate: v => Array.isArray(v) && v.length > 0,
  },
  excelTemplateUrl: { type: String, default: '' },
}, { timestamps: true });

const InputDefinition = mongoose.model('InputDefinition', inputDefinitionSchema);


/** OutputDefinition **/
const allowedOutputFieldTypes = [
  'text', 'number', 'percent', 'boolean', 'rating', 'currency', 'grade'
];

const outputFieldSchema = new Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, required: true, enum: allowedOutputFieldTypes },
  formula: { type: String, default: '' }, // công thức tính theo chuỗi, vd: "field1 + field2"
  description: { type: String, default: '' },
});

const outputDefinitionSchema = new Schema({
  report: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  outputFields: {
    type: [outputFieldSchema],
    validate: v => Array.isArray(v) && v.length > 0,
  },
  excelFormulaTemplateUrl: { type: String, default: '' },
}, { timestamps: true });

const OutputDefinition = mongoose.model('OutputDefinition', outputDefinitionSchema);


/** InputData **/
const inputDataSchema = new Schema({
  report: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  inputDefinition: { type: Schema.Types.ObjectId, ref: 'InputDefinition', required: true },
  data: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: v => v && typeof v === 'object' && !Array.isArray(v),
      message: 'Dữ liệu đầu vào phải là object hợp lệ',
    }
  },
  enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enteredAt: { type: Date, default: Date.now },
}, { timestamps: true });

const InputData = mongoose.model('InputData', inputDataSchema);


/** OutputData **/
const outputDataSchema = new Schema({
  report: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  outputDefinition: { type: Schema.Types.ObjectId, ref: 'OutputDefinition', required: true },
  data: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: v => v && typeof v === 'object' && !Array.isArray(v),
      message: 'Dữ liệu đầu ra phải là object hợp lệ',
    }
  },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const OutputData = mongoose.model('OutputData', outputDataSchema);

module.exports = {
  Report,
  InputDefinition,
  OutputDefinition,
  InputData,
  OutputData,
};
