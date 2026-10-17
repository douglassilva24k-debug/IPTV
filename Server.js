// Servidor Proxy IPTV Real em Node.js com Express e Axios
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware para ler requisições JSON e URL-encoded (necessário para o painel cadastrar usuários)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Link M3U Oficial (Público/Direto) - Mantém as atualizações automáticas do GitHub
const BASE_M3U_URL = "https://iptv-org.github.io/iptv/index.m3u";

// Banco de Usuários e Senhas (Memória ou flexível para receber novos cadastros)
const USUARIOS_PERMITIDOS = {
    "Douglassilva": "Douglas21k",
    "teste": "123456"
};

// 1. Rota para cadastrar novos usuários via painel ou formulário
app.post('/api/criar-usuario', (req, res) => {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) {
        return res.status(400).json({ erro: "Usuário e senha são obrigatórios." });
    }
    USUARIOS_PERMITIDOS[usuario] = senha;
    return res.json({ sucesso: true, mensagem: `Usuário ${usuario} criado com sucesso!` });
});

// 2. Endpoint do Link M3U Protegido (Usado no IPTV Pro com Login no Link)
app.get('/get.php', async (req, res) => {
    const { username, password } = req.query;

    // Validação de Usuário e Senha
    if (!username || !password || USUARIOS_PERMITIDOS[username] !== password) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(403).send("Acesso Negado: Usuário ou senha incorretos.");
    }

    try {
        // Busca a lista M3U original da internet
        const response = await axios.get(BASE_M3U_URL);
        res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
        return res.send(response.data);
    } catch (error) {
        return res.status(500).send("Erro ao carregar a lista de canais.");
    }
});

// 3. Autenticação para Apps Xtream Codes (/player_api.php)
app.get('/player_api.php', async (req, res) => {
    const { username, password } = req.query;

    if (USUARIOS_PERMITIDOS[username] === password) {
        return res.json({
            user_info: {
                username: username,
                status: "Active",
                auth: 1,
                message: "Autenticado com Sucesso"
            },
            server_info: {
                url: req.headers.host,
                port: "80"
            }
        });
    } else {
        return res.status(401).json({
            user_info: { auth: 0 },
            message: "Dados inválidos"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
