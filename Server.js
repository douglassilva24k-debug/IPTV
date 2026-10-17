// Servidor Proxy IPTV Real em Node.js com Express e Axios
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// Link M3U Base (Público/Direto) que será protegido pelo intermediário
const BASE_M3U_URL = "https://iptv-org.github.io/iptv/index.m3u";

// Banco de Usuários e Senhas Válidos
const USUARIOS_PERMITIDOS = {
    "cliente_vip": "senha8899",
    "teste": "123456"
};

// 1. Endpoint do Link M3U Protegido (get.php) - Usado pelo IPTV Pro
app.get('/get.php', async (req, res) => {
    const { username, password } = req.query;

    // Validação de Usuário e Senha
    if (!username || !password || USUARIOS_PERMITIDOS[username] !== password) {
        return res.status(403).send("Acesso Negado: Usuário ou senha incorretos.");
    }

    try {
        // Busca a lista M3U original em tempo real
        const response = await axios.get(BASE_M3U_URL);
        
        // Define o cabeçalho correto de M3U Playlist para o IPTV Pro reconhecer
        res.setHeader('Content-Type', 'application/x-mpegurl');
        res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
        
        // Entrega a lista de canais para o aplicativo
        res.send(response.data);
    } catch (error) {
        res.status(500).send("Erro ao carregar a lista M3U original.");
    }
});

// 2. Autenticação para Apps XTream Codes (player_api.php)
app.get('/player_api.php', async (req, res) => {
    const { username, password } = req.query;

    if (USUARIOS_PERMITIDOS[username] && USUARIOS_PERMITIDOS[username] === password) {
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
    }

    return res.status(401).json({ user_info: { auth: 0 } });
});

app.listen(PORT, () => {
    console.log(`Servidor IPTV Proxy ativo rodando na porta ${PORT}`);
});
