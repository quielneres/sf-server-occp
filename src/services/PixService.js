const axios = require('axios');
const {Buffer} = require("buffer");
const Wallet = require('../models/Wallet');

const API_BASE_URL = process.env.API_BASE_URL; // Ex: 'https://api.pagar.me/core/v5'
const PAGARME_API_KEY = process.env.PAGARME_API_KEY; // Sua chave secreta

/**
 * Gera uma ordem de pagamento via PIX usando a API do Pagar.me.
 * @param {object} payload - Os dados da ordem (amount, customer, etc.).
 * @returns {Promise<object>} - Retorna um objeto com o QR Code, valor formatado e data de expiração.
 */
const generatePix = async (payload) => {
    try {
        // const response = await axios.post(
        //     `${API_BASE_URL}/orders`,
        //     payload,
        //     {
        //         headers: {
        //             Authorization: 'Basic ' + Buffer.from(`${PAGARME_API_KEY}:`).toString('base64'),
        //             'Content-Type': 'application/json'
        //         }
        //     }
        // );

        const response = await axios.post(
            `${API_BASE_URL}/orders`,
            {
                "items": [
                    {
                        "amount": 2990,
                        "description": "Chaveiro do Tesseract",
                        "quantity": 1
                    }
                ],
                "customer": {
                    "name": "Tony Stark",
                    "email": "avengerstark@ligadajustica.com.br",
                    "type": "individual",
                    "document": "01234567890",
                    "phones": {
                        "home_phone": {
                            "country_code": "55",
                            "number": "22180513",
                            "area_code": "21"
                        }
                    }
                },
                "payments": [
                    {
                        "payment_method": "pix",
                        "pix": {
                            "expires_in": "52134613",
                            "additional_information": [
                                {
                                    "name": "Quantidade",
                                    "value": "2"
                                }
                            ]
                        }
                    }
                ]
            }
            ,
            {
                headers: {
                    Authorization:
                        'Basic ' + Buffer.from(`${PAGARME_API_KEY}:`).toString('base64'),
                    'Content-Type': 'application/json',
                },
            }
        );

        const charge = response.data.charges[0];
        const transaction = charge.last_transaction;

        // 🔹 Extrai os dados necessários
        const transactionId = charge.id;
        const qrCode = transaction.qr_code;
        const paymentAmount = (charge.amount / 100).toFixed(2).replace('.', ',');
        const expiration = new Date(transaction.expires_at).toLocaleString("pt-BR");

        console.log(`✅ PIX Criado com sucesso. Transaction ID: ${transactionId}`);

        let userId = '67acd34f2ca6cde87a52a4e0';

        // 🔹 Salva no banco de dados
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId, transactions: [] });
        }

        let amount = 20;

        wallet.transactions.push({
            transactionId,
            amount,
            type: 'deposit',
            status: 'pending',
            paymentMethod: 'pix'
        });

        await wallet.save();
        console.log("💾 Transação salva no banco de dados.");


        return response.data.valueOf();

        // console.log('responso pagarme',response.data.charges[0].last_transaction);
        //
        // const charge = response.data.charges[0];
        // const transaction = charge.last_transaction;
        // const qrCode = transaction.qr_code;
        // const paymentAmount = (charge.amount / 100).toFixed(2).replace('.', ',');
        // const expiration = new Date(transaction.expires_at).toLocaleString('pt-BR');
        //
        // return { qrCode, amount: `R$ ${paymentAmount}`, expiration };
    } catch (error) {
        console.error("Erro no PixService.generatePix:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Consulta o status de uma transação no Pagar.me
 * @param {string} transactionId - ID da transação no Pagar.me
 * @returns {Promise<string>} - Status da transação ("pending", "paid", "failed")
 */
const checkTransactionStatus = async (transactionId) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/charges/${transactionId}`,
            {
                headers: {
                    Authorization: 'Basic ' + Buffer.from(`${PAGARME_API_KEY}:`).toString('base64'),
                    'Content-Type': 'application/json'
                }
            }
        );

        const status = response.data.status; // Ex: "pending", "paid", "failed"
        console.log(`🔍 Status da transação ${transactionId}: ${status}`);

        return status;
    } catch (error) {
        console.error("❌ Erro ao verificar status do pagamento:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Atualiza o status da transação no banco de dados
 * @param {string} userId - ID do usuário
 * @param {string} transactionId - ID da transação
 * @returns {Promise<boolean>} - Retorna true se a transação foi confirmada
 */
const updateTransactionStatus = async (userId, transactionId) => {
    try {

        const status1 = await checkTransactionStatus(transactionId);

        console.log('status', status1)

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) return false;

        const transaction = wallet.transactions.find(tx => tx.transactionId === transactionId);
        if (!transaction) return false;

        const status = await checkTransactionStatus(transactionId);

        transaction.status = status;
        transaction.updatedAt = new Date();

        // Se foi pago, adiciona o saldo ao usuário
        if (status === 'paid') {
            wallet.balance += transaction.amount;
        }

        await wallet.save();
        console.log(`✅ Transação ${transactionId} atualizada para ${status}`);
        return status === 'paid';
    } catch (error) {
        console.error("❌ Erro ao atualizar transação:", error.message);
        return false;
    }
};

module.exports = {generatePix, checkTransactionStatus, updateTransactionStatus };

