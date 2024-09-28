# 🌐 Real-time Translator Chrome Extension

A powerful Chrome extension for real-time translation using multiple AI APIs.

## ✨ Features

- 🔄 Translate selected text on any webpage with a single click
- 🤖 Support for multiple AI models:
  - OpenAI
  - Anthropic
  - DeepSeek
  - Moonshot
- 🎨 Customizable translation prompts
- 🖱️ Easy-to-use popup interface for settings
- 🔒 Secure local storage of API keys
- ⚡ Caching mechanism for faster repeated translations
- 🚀 Preloading feature for improved response time

## 🛠️ Installation

1. Clone this repository or download the ZIP file and extract it.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## 📖 Usage

1. Click on the extension icon to open the settings popup.
2. Select your preferred AI model from the dropdown menu.
3. Enter your API key for the selected model.
4. (Optional) Customize the translation prompt.
5. Save your settings.
6. On any webpage, select the text you want to translate.
7. Click the translate button that appears near the selected text.
8. View the translation result in a popup box.

## ⚙️ Configuration

- **Model Selection**: Choose from OpenAI, Anthropic, DeepSeek, or Moonshot AI models.
- **API Key**: Enter your API key for the selected model. This is securely stored locally.
- **Custom Prompt**: Optionally set a custom prompt for the AI translator.

## 🔐 Privacy and Security

- API keys are stored locally and are never sent to any server other than the official API endpoints.
- No user data or translation history is collected or stored outside of your local browser storage.

## 👨‍💻 Development

This extension is built using vanilla JavaScript and utilizes Chrome Extension APIs. To contribute or modify:

1. Make your changes to the relevant files (`background.js`, `content.js`, `popup.js`, etc.).
2. Test your changes locally by reloading the extension in Chrome.
3. Submit a pull request with your improvements.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This extension is not officially associated with OpenAI, Anthropic, DeepSeek, or Moonshot. Users are responsible for complying with the terms of service of the respective AI providers.

---

<p align="center">
  Made with ❤️ by jjllzhang
</p>