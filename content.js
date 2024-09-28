console.log('Content script 开始加载');

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

  const button = document.createElement('button');
  button.textContent = '翻译';
  button.id = 'translate-button';
  button.style.position = 'fixed'; // 改为 fixed 定位
  button.style.zIndex = '2147483647'; // 使用最大的 z-index 值
  button.style.padding = '5px 10px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px'; // 确保字体大小合适
  
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  button.style.left = `${rect.left}px`;
  button.style.top = `${rect.bottom + 5}px`; // 添加一些偏移

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

  // 移除测试点击事件，因为它现在工作正常
  // setTimeout(() => {
  //   console.log('尝试模拟点击按钮');
  //   button.click();
  // }, 1000);
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
}

function showTranslationResult(translatedText) {
  console.log('显示翻译结果:', translatedText);
  removeTranslationResult(); // 移除现有的翻译结果框

  const resultBox = document.createElement('div');
  resultBox.id = 'translation-result';
  resultBox.style.position = 'fixed';
  resultBox.style.zIndex = '2147483647';
  resultBox.style.padding = '10px';
  resultBox.style.backgroundColor = 'white';
  resultBox.style.border = '1px solid #ccc';
  resultBox.style.borderRadius = '4px';
  resultBox.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  resultBox.style.maxWidth = '300px';
  resultBox.style.fontSize = '14px';
  resultBox.style.lineHeight = '1.4';
  resultBox.style.overflowY = 'auto';
  resultBox.style.maxHeight = '200px';

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
}

function removeTranslationResult() {
  const existingResult = document.getElementById('translation-result');
  if (existingResult) {
    existingResult.remove();
  }
}

console.log('Content script 加载完成');