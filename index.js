const express = require('express');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const app = express();
app.use(express.json());

// MÃ BẢO MẬT (Phải khớp với mã trong handler.php)
const SECRET_KEY = 'dang234'; 

app.get('/', (req, res) => {
  res.send('✅ Proxy Relay Server is LIVE and ready!');
});

app.post('/api', async (req, res) => {
  try {
    const { 
      api_key, // Nhận mã bảo mật
      proxy_host, 
      proxy_port, 
      proxy_user, 
      proxy_pass, 
      target_url, 
      payload 
    } = req.body;

    // 1. Kiểm tra mã bảo mật
    if (api_key !== SECRET_KEY) {
      return res.status(403).json({ success: false, message: 'Sai API Key. Từ chối truy cập!' });
    }

    if (!proxy_host || !proxy_port || !target_url) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin proxy hoặc target_url' });
    }

    // 2. Tạo chuỗi Proxy động
    let authString = '';
    if (proxy_user && proxy_pass) {
      authString = `${encodeURIComponent(proxy_user)}:${encodeURIComponent(proxy_pass)}@`;
    }
    const proxyUrl = `socks5://${authString}${proxy_host}:${proxy_port}`;
    
    const agent = new SocksProxyAgent(proxyUrl);

    // 3. Gửi request
    const response = await axios.post(target_url, payload || {}, {
      httpsAgent: agent,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000 
    });

    res.json({ success: true, data: response.data });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi gửi request qua proxy',
      details: error.message,
      server_response: error.response ? error.response.data : null
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Relay server đang chạy trên cổng ${PORT}`);
});