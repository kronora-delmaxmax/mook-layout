// 刊 · Mook Layout Lab — 极简后端代理
// 作用：1) 托管静态页面  2) 转发多模态大模型请求（解决浏览器 CORS / Key 直连问题）
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const SYSTEM_PROMPT = `你是一本日系生活方式杂志（mook）的资深编辑，风格参考 POPEYE 的卷首特辑：克制、具体、有现场感，绝不使用夸张的营销词汇。
用户会给你一张生活方式照片（早餐、咖啡、街景、穿搭等），请为它撰写杂志文案，严格输出 JSON，不要输出任何其他内容：
{
  "title": "大标题，8~12字，带栏目感，可用「｜」分隔栏目名与主题",
  "subtitle": "副标题，一句有画面感的话，20字以内",
  "english": "一句简短的英文小标题，斜体感，如 Breakfast Walk in the Old Town",
  "captions": ["图注一", "图注二", "图注三", "图注四"]
}
图注要求：每条20~40字；前两条具体描写照片中的实物（名称、质感、细节），后两条可以写氛围与感受；语言冷静细腻，像编辑在实物旁做的笔记；不要用emoji。`;

async function handleCaption(req, res) {
  let body = '';
  req.on('data', c => { body += c; if (body.length > 15e6) req.destroy(); });
  req.on('end', async () => {
    try {
      const { baseURL, apiKey, model, image, description } = JSON.parse(body);

      // 路径 A：免 Key 模式 —— 前端已在浏览器本地完成识图，这里用公益文本接口把英文描述润色成杂志文案
      if (description) {
        const ask = () => fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT + '\n重要：直接输出 JSON 本体，不要用 markdown 代码块包裹，不要输出思考过程。' },
              { role: 'user', content: '这是一段图像识别模型对照片的描述："' + description + '"。请据此撰写杂志文案，细节可在此基础上合理发挥。' }
            ],
            max_tokens: 900
          })
        });
        let lastErr = '';
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const up = await ask();
            if (!up.ok) { lastErr = '润色接口异常（' + up.status + '）'; continue; }
            const d = await up.json();
            const text = d.choices?.[0]?.message?.content || '';
            const m = text.match(/\{[\s\S]*\}/);
            if (m) {
              try { return json(res, 200, { ok: true, result: JSON.parse(m[0]) }); }
              catch (e) { lastErr = 'JSON 解析失败'; }
            } else {
              lastErr = '模型未返回有效 JSON';
            }
          } catch (e) { lastErr = e.message; }
        }
        return json(res, 502, { error: lastErr + '，请重试' });
      }

      // 路径 B：自带 Key —— 直连多模态视觉模型
      if (!baseURL || !apiKey || !model || !image) {
        return json(res, 400, { error: '缺少必要参数（baseURL / apiKey / model / image）' });
      }
      const upstream = await fetch(baseURL.replace(/\/+$/, '') + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: [
              { type: 'text', text: '请为这张照片撰写杂志文案。' },
              { type: 'image_url', image_url: { url: image } }
            ]}
          ],
          temperature: 0.8,
          max_tokens: 800
        })
      });
      const data = await upstream.json();
      if (!upstream.ok) return json(res, upstream.status, { error: data.error?.message || ('上游 API 错误 ' + upstream.status) });

      const text = data.choices?.[0]?.message?.content || '';
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) return json(res, 502, { error: '模型未返回有效 JSON', raw: text.slice(0, 300) });
      const parsed = JSON.parse(m[0]);
      json(res, 200, { ok: true, result: parsed });
    } catch (e) {
      json(res, 500, { error: '代理服务错误：' + e.message });
    }
  });
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/caption') return handleCaption(req, res);
  // 静态文件
  let p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = path.join(__dirname, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not Found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log('Mook Layout Lab running on :' + PORT));
