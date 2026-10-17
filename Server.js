// Servidor Proxy IPTV Real em Node.js com Express e Axios
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Link M3U Oficial/Direto onde realmente estão os canais
const BASE_M3U_URL = "https://iptv-org.github.io/iptv/index.m3u";

// Banco de Usuários e Senhas Válidos (Gerenciado pelo seu painel)
const USUARIOS_PERMITIDOS = {
    "cliente_vip": "senha8899",
    "teste": "123456"
};

// 1. Endpoint de Acesso M3U Protegido (get.php) - Usado pelo IPTV Pro
app.get('/get.php', (req, res) => {
    let { username, password } = req.query;

    // Suporte caso o aplicativo envie via Autenticação Básica HTTP
    if (!username || !password) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Basic ')) {
            const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
            const parts = credentials.split(':');
            username = parts[0];
            password = parts[1];
        }
    }

    // Validação de Usuário e Senha
    if (!username || !password || USUARIOS_PERMITIDOS[username] !== password) {
        return res.status(403).send("Acesso Negado: Usuário ou senha incorretos.");
    }

    // Validação correta: Redireciona o aplicativo diretamente para o link M3U oficial
    return res.redirect(302, BASE_M3U_URL);
});

// 2. Autenticação para Apps XTream Codes (player_api.php)
app.get('/player_api.php', (req, res) => {
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

// Endpoint adicional para compatibilidade com painéis Xtream
app.get('/player.php', (req, res) => {
    res.send("Painel IPTV Ativo");
});

app.listen(PORT, () => {
    console.log(`Servidor IPTV Proxy (Redirecionamento) ativo rodando na porta ${PORT}`);
});
