document.addEventListener('DOMContentLoaded', function() {
    const modelSelect = document.getElementById('model-select');
    const apiKeyInput = document.getElementById('api-key');
    const customPromptInput = document.getElementById('custom-prompt');
    const saveButton = document.getElementById('save-settings');
    const statusElement = document.getElementById('status');
    const form = document.getElementById('settings-form');

    // Load saved settings
    chrome.storage.sync.get(['selectedModel', 'apiKeys', 'customPrompt'], function(data) {
        if (data.selectedModel) {
            modelSelect.value = data.selectedModel;
        }
        if (data.apiKeys && data.apiKeys[data.selectedModel]) {
            apiKeyInput.value = data.apiKeys[data.selectedModel];
        }
        if (data.customPrompt) {
            customPromptInput.value = data.customPrompt;
        }
    });

    // Update API key input when selected model changes
    modelSelect.addEventListener('change', function() {
        chrome.storage.sync.get('apiKeys', function(data) {
            const apiKeys = data.apiKeys || {};
            apiKeyInput.value = apiKeys[modelSelect.value] || '';
        });
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const selectedModel = modelSelect.value;
        const apiKey = apiKeyInput.value;
        const customPrompt = customPromptInput.value;

        chrome.storage.sync.get('apiKeys', function(data) {
            const apiKeys = data.apiKeys || {};
            apiKeys[selectedModel] = apiKey;

            chrome.storage.sync.set({
                selectedModel: selectedModel,
                apiKeys: apiKeys,
                customPrompt: customPrompt
            }, function() {
                statusElement.textContent = 'Settings saved';
                setTimeout(() => {
                    statusElement.textContent = '';
                }, 2000);
            });
        });
    });
});