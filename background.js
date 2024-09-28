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
    } else {
        console.log('Received message with unknown action:', request);
        sendResponse({ error: 'Unknown action' });
    }
});

async function translateText(text, model, apiKey) {
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
                    temperature: 0.7
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
                    ]
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
                    stream: false
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
                    temperature: 0.3
                });
                break;
        }

        console.log('Sending request to API:', apiUrl);
        console.log('Request headers:', headers);
        console.log('Request body:', body);

        const response = await fetch(apiUrl, { method: 'POST', headers, body });

        if (!response.ok) {
            console.error('API response not successful:', response.status, response.statusText);
            const errorBody = await response.text();
            console.error('Error response body:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();
        console.log('API response data:', JSON.stringify(data, null, 2));

        let translatedText = '';  // Initialize as empty string

        switch (model) {
            case 'openai':
            case 'deepseek':
            case 'moonshot':
                translatedText = data.choices[0].message.content.trim();
                break;
            case 'anthropic':
                translatedText = data.content[0].text.trim();
                break;
        }

        if (!translatedText) {
            console.error('No translated text found');
            throw new Error('No translated text found in the API response');
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const logMessage = `Translation completed in ${duration.toFixed(2)} ms, result: ${translatedText}`;
        
        // Send log message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "log", message: logMessage});
            }
        });
        
        return translatedText;
    } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const errorMessage = `Error during translation (after ${duration.toFixed(2)} ms): ${error.message}`;
        
        // Send error message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "log", message: errorMessage, isError: true});
            }
        });
        
        throw error;
    }
}

console.log('Background script loading completed');