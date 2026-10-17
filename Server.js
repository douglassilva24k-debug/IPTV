// Servidor Proxy IPTV com Redirecionamento HTTP Direto (Render)
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Link M3U Oficial e Direto (com atualizações automáticas)
const BASE_M3U_URL = "https://iptv-org.github.io/iptv/index.m3u";

// Banco de Usuários e Senhas Válidos
const USUARIOS_PERMITIDOS = {
    "Douglassilva": "Douglas21k",
    "teste": "123456"
};

// 1. Endpoint do Link M3U Protegido (get.php)
app.get('/get.php', (req, res) => {
    const { username, password } = req.query;

    // Validação de Usuário e Senha
    if (!username || !password || USUARIOS_PERMITIDOS[username] !== password) {
        return res.status(403).type('text/plain').send("Acesso Negado: Usuário ou senha incorretos.");
    }

    // Redirecionamento oficial direto para o link da lista de canais
    return res.redirect(302, BASE_M3U_URL);
});

// 2. Autenticação para Apps XTream Codes (player_api.php)
app.get('/player_api.php', (req, res) => {
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
