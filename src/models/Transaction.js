const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    transactionId: { type: Number, required: true },
    chargerId: { type: String, required: true },
    connectorId: { type: Number, required: true },
    idTag: { type: String, required: true },
    meterStart: { type: Number, required: true },
    meterStop: { type: Number },
    timestampStart: { type: Date, required: true },
    timestampStop: { type: Date },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
    meterValues: [
        {
            timestamp: { type: Date },
            energy: { type: Number }, // Energia acumulada em Wh
            power: { type: Number }   // Potência em W
        }
    ]
});

module.exports = mongoose.model('Transaction', TransactionSchema);
