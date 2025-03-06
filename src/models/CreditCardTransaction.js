const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    type: { type: String, enum: ['deposit', 'payment'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['pix', 'credit_card'], required: true },
    transactionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});


const CreditCardTransactionSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    creditCardId: { type: String, required: true },
    amount: { type: Number, default: 0 },
    transactions: [TransactionSchema]
});

module.exports = mongoose.model('CreditCardTransaction', CreditCardTransactionSchema);
