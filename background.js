console.log('Background script loading started');

const API_URLS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    deepseek: 'https://api.deepseek.com/chat/completions',
    moonshot: 'https://api.moonshot.cn/v1/chat/completions'
};

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    if (request.action === "translate") {
        chrome.storage.sync.get(['selectedModel', 'apiKeys'], function(data) {
            const selectedModel = data.selectedModel || 'openai';
            const apiKeys = data.apiKeys || {};
            const apiKey = apiKeys[selectedModel];

            console.log('Using model:', selectedModel);
            console.log('API Key exists:', !!apiKey);

            if (apiKey) {
                translateText(request.text, selectedModel, apiKey)
                    .then(translatedText => {
                        console.log('Translation successful, sending response:', translatedText);
                        sendResponse({ translatedText });
                    })
                    .catch(error => {
                        console.error('Translation error:', error);
                        sendResponse({ error: error.message });
                    });
            } else {
                console.error('API Key not set');
                sendResponse({ error: 'API Key not set' });
            }
        });
        return true;  // Keep message channel open for async response
    } else if (request.action === "preloadTranslation") {
        chrome.storage.sync.get(['selectedModel', 'apiKeys'], function(data) {
            const selectedModel = data.selectedModel || 'openai';
            const apiKeys = data.apiKeys || {};
            const apiKey = apiKeys[selectedModel];
            if (apiKey) {
                preloadTranslation(request.text, selectedModel, apiKey);
            }
        });
    } else {
        console.log('Received message with unknown action:', request);
        sendResponse({ error: 'Unknown action' });
    }
});

// 添加一个简单的缓存
const translationCache = new Map();

async function translateText(text, model, apiKey) {
    const cacheKey = `${model}:${text}`;
    
    if (translationCache.has(cacheKey)) {
        sendPartialTranslation(translationCache.get(cacheKey), true);
        return translationCache.get(cacheKey);
    }

    const startTime = performance.now();
    try {
        const { customPrompt } = await chrome.storage.sync.get('customPrompt');
        const defaultPrompt = "You are a translator. Translate the following text to Chinese.";
        const prompt = customPrompt || defaultPrompt;

        const apiUrl = API_URLS[model];
        let headers = {
            'Content-Type': 'application/json',
        };
        let body;

        switch (model) {
            case 'openai':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: prompt },
                        { role: "user", content: text }
                    ],
                    temperature: 0.7,
                    stream: true
                });
                break;
            case 'anthropic':
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
                headers['anthropic-dangerous-direct-browser-access'] = 'true';
                body = JSON.stringify({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1024,
                    messages: [
                        { role: "user", content: prompt + "\n\n" + text }
                    ],
                    stream: true
                });
                break;
            case 'deepseek':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: prompt },
                        { role: "user", content: text }
                    ],
                    stream: true
                });
                break;
            case 'moonshot':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = JSON.stringify({
                    model: "moonshot-v1-8k",
                    messages: [
                        { role: "system", content: prompt },
                        { role: "user", content: text }
                    ],
                    temperature: 0.3,
                    stream: true
                });
                break;
        }

        const response = await fetch(apiUrl, { method: 'POST', headers, body });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let translatedText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.trim() === 'data: [DONE]') {
                    continue; // Skip the [DONE] message
                }
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        let content = '';

                        switch (model) {
                            case 'openai':
                            case 'deepseek':
                            case 'moonshot':
                                content = data.choices[0].delta.content || '';
                                break;
                            case 'anthropic':
                                content = data.delta?.text || '';
                                break;
                        }

                        translatedText += content;
                        sendPartialTranslation(translatedText, false);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        console.error('Problematic line:', line);
                    }
                }
            }
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const logMessage = `Translation completed in ${duration.toFixed(2)} ms`;
        
        sendLogMessage(logMessage);
        sendPartialTranslation(translatedText, true); // 发送最终结果
        
        translationCache.set(cacheKey, translatedText);

        return translatedText;
    } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const errorMessage = `Error during translation (after ${duration.toFixed(2)} ms): ${error.message}`;
        
        sendLogMessage(errorMessage, true);
        sendPartialTranslation(`Translation error: ${error.message}`);
        
        throw error;
    }
}

function sendPartialTranslation(text, isFinal) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "updateTranslation", text: text, isFinal: isFinal});
        }
    });
}

function sendLogMessage(message, isError = false) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "log", message: message, isError: isError});
        }
    });
}

// 预加载函数
function preloadTranslation(text, model, apiKey) {
    translateText(text, model, apiKey).catch(console.error);
}

console.log('Background script loading completed');