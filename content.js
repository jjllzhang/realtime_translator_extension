console.log('Content script loading started');

// Check if chrome.runtime is available
if (typeof chrome !== 'undefined' && chrome.runtime) {
  initializeExtension();
} else {
  console.error('chrome.runtime is not available, the extension may not work properly');
}

function initializeExtension() {
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('click', handleDocumentClick);

  function handleMouseUp(event) {
    if (event.target.id === 'translate-button') {
      return;
    }
    
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      showTranslateButton(selectedText);
      // 触发预加载
      chrome.runtime.sendMessage({ action: "preloadTranslation", text: selectedText });
    } else {
      removeExistingButton();
      removeTranslationResult();
    }
  }

  function handleDocumentClick(event) {
    if (event.target.id !== 'translate-button' && event.target.id !== 'translation-result') {
      removeExistingButton();
      removeTranslationResult();
    }
  }

  function showTranslateButton(text) {
    removeExistingButton();

    const button = document.createElement('div');
    button.id = 'translate-button';
    button.style.position = 'fixed';
    button.style.zIndex = '2147483647';
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.cursor = 'pointer';
    button.style.backgroundImage = 'url(' + chrome.runtime.getURL('translate.svg') + ')';
    button.style.backgroundSize = 'contain';
    button.style.backgroundRepeat = 'no-repeat';
    button.style.backgroundPosition = 'center';
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    button.style.left = `${rect.left}px`;
    button.style.top = `${rect.bottom + 5}px`;

    button.onclick = createClickHandler(text);

    document.body.appendChild(button);
    console.log('Translate button added to the page');
    console.log('Button element:', button);

    // Ensure the button is not immediately removed
    setTimeout(() => {
      if (!document.body.contains(button)) {
        document.body.appendChild(button);
        console.log('Button re-added to the page');
      }
    }, 100);
  }

  function createClickHandler(text) {
    return function(e) {
      e.preventDefault(); // Prevent default behavior
      e.stopPropagation(); // Stop event propagation
      console.log('Translate button clicked');
      translateText(text);
      // No longer remove the button here, allowing users to click multiple times
    };
  }

  function removeExistingButton() {
    const existingButton = document.getElementById('translate-button');
    if (existingButton) {
      existingButton.remove();
    }
  }

  function translateText(text) {
    console.log('Sending translation request:', text);
    try {
      chrome.runtime.sendMessage({ action: "translate", text }, (response) => {
        console.log('Received translation response:', response);
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          showTranslationResult(`Translation error: ${chrome.runtime.lastError.message}`);
        } else if (response && response.error) {
          showTranslationResult(`Translation error: ${response.error}`);
        } else if (response && response.translatedText) {
          showTranslationResult(response.translatedText);
        } else {
          console.error('Unexpected response received:', response);
          showTranslationResult('Translation failed: Unexpected response received');
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      showTranslationResult(`Message sending error: ${error.message}`);
    }
  }

  function showTranslationResult(translatedText) {
    console.log('Displaying translation result:', translatedText);
    removeTranslationResult(); // Remove existing translation result box

    const resultBox = document.createElement('div');
    resultBox.id = 'translation-result';
    resultBox.style.position = 'fixed';
    resultBox.style.zIndex = '2147483647';
    resultBox.style.padding = '10px';
    resultBox.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Semi-transparent white background
    resultBox.style.color = '#333'; // Dark gray text
    resultBox.style.border = '1px solid rgba(0, 0, 0, 0.2)';
    resultBox.style.borderRadius = '8px';
    resultBox.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)';
    resultBox.style.maxWidth = '300px';
    resultBox.style.fontSize = '14px';
    resultBox.style.lineHeight = '1.5';
    resultBox.style.overflowY = 'auto';
    resultBox.style.maxHeight = '200px';
    resultBox.style.backdropFilter = 'blur(5px)'; // Background blur effect
    resultBox.style.transition = 'all 0.3s ease'; // Smooth transition effect

    resultBox.textContent = translatedText;

    const button = document.getElementById('translate-button');
    if (button) {
      resultBox.style.left = button.style.left;
      resultBox.style.top = `${parseInt(button.style.top) + 30}px`;
    } else {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      resultBox.style.left = `${rect.left}px`;
      resultBox.style.top = `${rect.bottom + 35}px`;
    }

    document.body.appendChild(resultBox);

    // Add hover effect
    resultBox.onmouseover = function() {
      this.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.12)';
    };
    resultBox.onmouseout = function() {
      this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)';
    };
  }

  function removeTranslationResult() {
    const existingResult = document.getElementById('translation-result');
    if (existingResult) {
      existingResult.remove();
    }
  }
}

// Add this listener to receive log messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "log") {
        if (request.isError) {
            console.error(request.message);
        } else {
            console.log(request.message);
        }
    }
});

console.log('Content script loading completed');