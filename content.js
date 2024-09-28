console.log('Content script 开始加载');

// 检查 chrome.runtime 是否可用
if (typeof chrome !== 'undefined' && chrome.runtime) {
  initializeExtension();
} else {
  console.error('chrome.runtime 不可用，扩展可能无法正常工作');
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
    console.log('翻译按钮已添加到页面');
    console.log('按钮元素:', button);

    // 确保按钮不会被立即移除
    setTimeout(() => {
      if (!document.body.contains(button)) {
        document.body.appendChild(button);
        console.log('按钮被重新添加到页面');
      }
    }, 100);
  }

  function createClickHandler(text) {
    return function(e) {
      e.preventDefault(); // 阻止默认行为
      e.stopPropagation(); // 阻止事件冒泡
      console.log('翻译按钮被点击');
      translateText(text);
      // 不再在这里移除按钮，让用户可以多次点击翻译
    };
  }

  function removeExistingButton() {
    const existingButton = document.getElementById('translate-button');
    if (existingButton) {
      existingButton.remove();
    }
  }

  function translateText(text) {
    console.log('发送翻译请求:', text);
    try {
      chrome.runtime.sendMessage({ action: "translate", text }, (response) => {
        console.log('收到翻译响应:', response);
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          showTranslationResult(`翻译错误: ${chrome.runtime.lastError.message}`);
        } else if (response && response.error) {
          showTranslationResult(`翻译错误: ${response.error}`);
        } else if (response && response.translatedText) {
          showTranslationResult(response.translatedText);
        } else {
          console.error('未收到预期的响应:', response);
          showTranslationResult('翻译失败：未收到预期的响应');
        }
      });
    } catch (error) {
      console.error('发送消息时出错:', error);
      showTranslationResult(`发送消息错误: ${error.message}`);
    }
  }

  function showTranslationResult(translatedText) {
    console.log('显示翻译结果:', translatedText);
    removeTranslationResult(); // 移除现有的翻译结果框

    const resultBox = document.createElement('div');
    resultBox.id = 'translation-result';
    resultBox.style.position = 'fixed';
    resultBox.style.zIndex = '2147483647';
    resultBox.style.padding = '10px';
    resultBox.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // 半透明白色背景
    resultBox.style.color = '#333'; // 深灰色文字
    resultBox.style.border = '1px solid rgba(0, 0, 0, 0.2)';
    resultBox.style.borderRadius = '8px';
    resultBox.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)';
    resultBox.style.maxWidth = '300px';
    resultBox.style.fontSize = '14px';
    resultBox.style.lineHeight = '1.5';
    resultBox.style.overflowY = 'auto';
    resultBox.style.maxHeight = '200px';
    resultBox.style.backdropFilter = 'blur(5px)'; // 背景模糊效果
    resultBox.style.transition = 'all 0.3s ease'; // 平滑过渡效果

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

    // 添加悬停效果
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

console.log('Content script 加载完成');