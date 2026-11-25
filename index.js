const express = require('express');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const app = express();
app.use(express.json());

// Endpoint nhận request từ Hosting
app.post('/api', async (req, res) => {
  try {
    const { 
      proxy_host, 
      proxy_port, 
      proxy_user, 
      proxy_pass, 
      target_url, 
      payload 
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!proxy_host || !proxy_port || !target_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin proxy (IP, Port) hoặc target_url' 
      });
    }

    // 1. Tạo chuỗi Proxy động
    // Định dạng: socks5://user:pass@ip:port
    let authString = '';
    if (proxy_user && proxy_pass) {
      authString = `${encodeURIComponent(proxy_user)}:${encodeURIComponent(proxy_pass)}@`;
    }
    const proxyUrl = `socks5://${authString}${proxy_host}:${proxy_port}`;
    
    // 2. Khởi tạo Agent kết nối qua Proxy
    const agent = new SocksProxyAgent(proxyUrl);

    // 3. Gửi request HTTPS đến web gốc xuyên qua Proxy
    const response = await axios.post(target_url, payload || {}, {
      httpsAgent: agent,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000 // Timeout 15s
    });

    // 4. Trả kết quả về cho Hosting
    res.json({
      success: true,
      data: response.data
    });

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