document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('api-key');
    const customPromptInput = document.getElementById('custom-prompt');
    const saveButton = document.getElementById('save-settings');
    const statusElement = document.getElementById('status');
    const form = document.getElementById('settings-form');

    // 加载保存的设置
    chrome.storage.sync.get(['apiKey', 'customPrompt'], function(data) {
        if (data.apiKey) {
            apiKeyInput.value = data.apiKey;
        }
        if (data.customPrompt) {
            customPromptInput.value = data.customPrompt;
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const apiKey = apiKeyInput.value;
        const customPrompt = customPromptInput.value;
        chrome.storage.sync.set({apiKey: apiKey, customPrompt: customPrompt}, function() {
            statusElement.textContent = '设置已保存';
            setTimeout(() => {
                statusElement.textContent = '';
            }, 2000);
        });
    });
});