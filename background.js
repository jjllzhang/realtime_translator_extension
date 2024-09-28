console.log('Background script 开始加载');

const API_KEY = 'sk-864bab6974624441b0c1e1af76cef1ac';
const API_URL = 'https://api.deepseek.com/chat/completions';

chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装/更新');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('后台脚本收到消息:', request);
  if (request.action === "translate") {
    translateText(request.text)
      .then(translatedText => {
        console.log('翻译成功:', translatedText);
        sendResponse({ translatedText });
      })
      .catch(error => {
        console.error('翻译错误:', error);
        sendResponse({ error: error.message });
      });
    return true;  // 保持消息通道开放，以便异步发送响应
  } else {
    console.log('收到未知action的消息:', request);
    sendResponse({ error: '未知的action' });
  }
});

async function translateText(text) {
  console.log('开始翻译:', text);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a translator. Translate the following text to Chinese." },
          { role: "user", content: text }
        ],
        stream: false
      })
    });

    console.log('API响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API响应数据:', data);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('翻译过程中出错:', error);
    throw error;
  }
}

console.log('Background script 加载完成');