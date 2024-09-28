document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save-api-key');
    const statusElement = document.getElementById('status');

    // 加载保存的API key
    chrome.storage.sync.get('apiKey', function(data) {
        if (data.apiKey) {
            apiKeyInput.value = data.apiKey;
        }
    });

    saveButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value;
        chrome.storage.sync.set({apiKey: apiKey}, function() {
            statusElement.textContent = 'API Key已保存';
            setTimeout(() => {
                statusElement.textContent = '';
            }, 2000);
        });
    });
});