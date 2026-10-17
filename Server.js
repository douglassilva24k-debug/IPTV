// Servidor Proxy IPTV Real em Node.js com Express e Axios
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// Link M3U Base (Público/Direto) que será protegido pelo intermediário
const BASE_M3U_URL = "https://iptv-org.github.io/iptv/index.m3u";

// Banco de Usuários e Senhas Válidos (No futuro, você pode substituir por um banco de dados)
const USUARIOS_PERMITIDOS = {
    "cliente_vip": "senha8899",
    "teste": "123456"
};

// 1. Endpoint do Link M3U Protegido (get.php) - Usado pelo IPTV Pro
app.get('/get.php', async (req, res) => {
    let { username, password } = req.query;

    // Suporte alternativo caso o player envie via autenticação básica HTTP
    if (!username || !password) {
        const b6po = req.headers.authorization;
        if (b6po && b6po.startsWith('Basic ')) {
            const credentials = Buffer.from(b6po.split(' ')[1], 'base64').toString().ascii();
            const parts = credentials.split(':');
            username = parts[0];
            password = parts[1];
        }
    }

    // Validação de Usuário e Senha
    if (!username || !password || USUARIOS_PERMITIDOS[username] !== password) {
        return res.status(403).send("Acesso Negado: Usuário ou senha incorretos.");
    }

    try {
        // Busca a lista M3U original em tempo real
        const response = await axios.get(BASE_M3U_URL, {
            responseType: 'text' // Garante que receba como texto puro
        });
        
        // Define o cabeçalho correto de M3U Playlist para o aplicativo reconhecer
        res.setHeader('Content-Type', 'application/x-mpegurl');
        res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
        
        // Entrega a lista de canais obtida para o aplicativo
        return res.send(response.data);
    } catch (error) {
        console.error("Erro ao buscar M3U:", error.message);
        return res.status(500).send("Erro ao carregar a lista M3U original.");
    }
});

// 2. Autenticação para Apps XTream Codes (player_api.php)
app.get('/player_api.php', async (req, res) => {
    const { username, password } = req.query;

    if (username && password && USUARIOS_PERMITIDOS[username] === password) {
        return res.json({
            user_info: {
                username: username,
                status: "Active",
                auth: 1,
                message: "Autenticado com Sucesso",
                is_trial: "0",
                active_cons: "1",
                created_at: "1600000000",
                exp_date: "2030-01-01 00:00:00",
                allowed_output_formats: ["m3u8", "ts", "rtmp"]
            },
            server_info: {
                url: req.headers.host,
                port: process.env.PORT || "80",
                https_port: process.env.PORT || "443",
                server_protocol: "https",
                rtmp_port: "8080",
                timezone: "America/Sao_Paulo"
            }
        });
    }

    return res.status(401).json({ user_info: { auth: 0 } });
});

// Endpoint coringa para categorias ou ações do Xtream Codes (evita erro 404 no painel)
app.get('/player.php', (req, res) => {
    res.send("Painel IPTV Ativo");
});

app.listen(PORT, () => {
    console.log(`Servidor IPTV Proxy ativo rodando na porta ${PORT}`);
});
