const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OCPPServer = require('./ocpp/OCPPServer'); // Importe o OCPPServer corretamente
const chargersRouter = require('./routes/chargers');
const swaggerDocs = require('./utils/swagger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log(' MongoDB conectado'))
    .catch(err => console.error(' Erro ao conectar no MongoDB:', err));

// Iniciar Servidor OCPP
const ocppServer = new OCPPServer(); // Crie uma instância do OCPPServer
ocppServer.start().then(() => { // Inicie o servidor OCPP
    console.log('Servidor OCPP iniciado com sucesso.');
}).catch(err => {
    console.error('Erro ao iniciar o servidor OCPP:', err);
});

app.set('ocppServer', ocppServer); // Defina o servidor OCPP no app

global.ocppClients = new Map();
global.activeTransactions = new Map();

// Rotas REST API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/chargers', require('./routes/chargers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/charging', require('./routes/charging'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/cards', require('./routes/cardRoutes'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/pix', require('./routes/pix'));

// Documentação Swagger
swaggerDocs(app);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API REST rodando em https://api-solfort.up.railway.app/:${PORT}`);
});