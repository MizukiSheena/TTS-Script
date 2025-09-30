class MediaCreationTool {
    constructor() {
        this.audioData = null;
        this.scriptData = null;
        this.initializeEventListeners();
        this.initializeMarkdownEditor();
        this.loadSettings();
    }

    initializeEventListeners() {
        // API设置
        document.getElementById('tts-api-key').addEventListener('change', () => {
            this.saveSettings();
            this.updateApiStatus();
        });
        document.getElementById('azure-region').addEventListener('change', () => {
            this.saveSettings();
        });
        document.getElementById('deepseek-api-key').addEventListener('change', () => {
            this.saveSettings();
            this.updateApiStatus();
        });

        // 编辑器按钮
        document.getElementById('clear-btn').addEventListener('click', () => this.clearEditor());
        document.getElementById('sample-btn').addEventListener('click', () => this.loadSampleContent());
        document.getElementById('export-md-btn').addEventListener('click', () => this.exportMarkdown());

        // 语音设置
        document.getElementById('speech-rate').addEventListener('input', (e) => {
            document.getElementById('rate-value').textContent = e.target.value + 'x';
        });

        // 功能按钮
        document.getElementById('generate-audio-btn').addEventListener('click', () => this.generateAudio());
        document.getElementById('generate-titles-btn').addEventListener('click', () => this.generateTitles());

        // 下载按钮
        document.getElementById('download-audio-btn').addEventListener('click', () => this.downloadAudio());
        document.getElementById('download-script-btn').addEventListener('click', () => this.downloadScript());
        document.getElementById('copy-titles-btn').addEventListener('click', () => this.copyTitles());
    }

    initializeMarkdownEditor() {
        const editor = document.getElementById('markdown-editor');
        const preview = document.getElementById('markdown-preview');

        // 实时预览
        editor.addEventListener('input', () => {
            const markdownText = editor.value;
            const html = marked.parse(markdownText);
            preview.innerHTML = html;

            // 应用代码高亮
            preview.querySelectorAll('pre code').forEach((block) => {
                Prism.highlightElement(block);
            });
        });

        // 初始化预览
        editor.dispatchEvent(new Event('input'));
    }

    loadSettings() {
        const ttsKey = localStorage.getItem('tts-api-key');
        const azureRegion = localStorage.getItem('azure-region');
        const deepseekKey = localStorage.getItem('deepseek-api-key');

        if (ttsKey) document.getElementById('tts-api-key').value = ttsKey;
        if (azureRegion) document.getElementById('azure-region').value = azureRegion;
        if (deepseekKey) document.getElementById('deepseek-api-key').value = deepseekKey;

        this.updateApiStatus();
    }

    saveSettings() {
        const ttsKey = document.getElementById('tts-api-key').value;
        const azureRegion = document.getElementById('azure-region').value;
        const deepseekKey = document.getElementById('deepseek-api-key').value;

        localStorage.setItem('tts-api-key', ttsKey);
        localStorage.setItem('azure-region', azureRegion);
        localStorage.setItem('deepseek-api-key', deepseekKey);
    }

    updateApiStatus() {
        const ttsKey = document.getElementById('tts-api-key').value.trim();
        const deepseekKey = document.getElementById('deepseek-api-key').value.trim();

        const azureStatus = document.getElementById('azure-status');
        const deepseekStatus = document.getElementById('deepseek-status');

        // 更新Azure TTS状态
        if (ttsKey) {
            azureStatus.textContent = '已配置';
            azureStatus.className = 'status-indicator configured';
        } else {
            azureStatus.textContent = '未配置';
            azureStatus.className = 'status-indicator';
        }

        // 更新DeepSeek状态
        if (deepseekKey) {
            deepseekStatus.textContent = '已配置';
            deepseekStatus.className = 'status-indicator configured';
        } else {
            deepseekStatus.textContent = '未配置';
            deepseekStatus.className = 'status-indicator';
        }
    }

    clearEditor() {
        document.getElementById('markdown-editor').value = '';
        document.getElementById('markdown-preview').innerHTML = '';
    }

    loadSampleContent() {
        const sampleText = `# 如何提高工作效率

## 时间管理的重要性

在现代快节奏的工作环境中，**时间管理**是每个人都需要掌握的重要技能。

### 主要策略

1. **制定优先级**
   - 使用四象限法则
   - 区分重要和紧急

2. **避免干扰**
   - 关闭不必要的通知
   - 专注于单一任务

3. **合理休息**
   - 使用番茄工作法
   - 定期进行短暂休息

> "时间就像海绵里的水，只要愿意挤，总还是有的。" —— 鲁迅

### 工具推荐

- **任务管理**: Todoist, Notion
- **时间追踪**: RescueTime, Toggl
- **专注工具**: Forest, Cold Turkey

## 总结

通过合理的时间管理和工具使用，我们可以显著提高工作效率，实现更好的工作生活平衡。

---

*记住：效率不是做更多的事，而是做对的事。*`;

        document.getElementById('markdown-editor').value = sampleText;
        document.getElementById('markdown-editor').dispatchEvent(new Event('input'));
    }

    exportMarkdown() {
        const content = document.getElementById('markdown-editor').value.trim();

        if (!content) {
            alert('请先输入Markdown内容');
            return;
        }

        // 提取第一行标题作为文件名
        const lines = content.split('\n');
        let title = 'untitled';

        for (let line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('# ')) {
                title = trimmedLine.substring(2).trim();
                // 清理文件名中的特殊字符
                title = title.replace(/[<>:"/\\|?*]/g, '-');
                break;
            }
        }

        // 添加日期
        const now = new Date();
        const dateStr = now.getFullYear() + '-' +
                       String(now.getMonth() + 1).padStart(2, '0') + '-' +
                       String(now.getDate()).padStart(2, '0');

        const filename = `${title}_${dateStr}.md`;

        // 创建下载
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast(`已导出: ${filename}`);
    }

    showProgress(text = '正在处理...') {
        document.getElementById('progress-text').textContent = text;
        document.getElementById('progress-indicator').style.display = 'block';
    }

    hideProgress() {
        document.getElementById('progress-indicator').style.display = 'none';
    }

    async generateAudio() {
        const content = document.getElementById('markdown-editor').value.trim();
        const apiKey = document.getElementById('tts-api-key').value.trim();
        const voice = document.getElementById('voice-select').value;
        const rate = document.getElementById('speech-rate').value;

        if (!content) {
            alert('请先输入要转换的文本内容');
            return;
        }

        if (!apiKey) {
            alert('请先配置 TTS API Key');
            return;
        }

        this.showProgress('正在生成音频...');

        try {
            // 清理markdown格式，提取纯文本
            const cleanText = this.cleanMarkdownText(content);

            // 调用Azure认知服务TTS API
            const audioResult = await this.callAzureTTS(cleanText, apiKey, voice, rate);

            // 生成时间戳脚本
            const script = this.generateTimestampScript(cleanText);

            this.audioData = audioResult;
            this.scriptData = script;

            // 显示结果
            this.displayAudioResult(audioResult);

        } catch (error) {
            console.error('生成音频失败:', error);
            alert('生成音频失败: ' + error.message);
        } finally {
            this.hideProgress();
        }
    }

    cleanMarkdownText(markdown) {
        // 移除markdown格式标记
        return markdown
            .replace(/#{1,6}\s+/g, '') // 标题
            .replace(/\*\*(.*?)\*\*/g, '$1') // 粗体
            .replace(/\*(.*?)\*/g, '$1') // 斜体
            .replace(/`{1,3}[^`]*`{1,3}/g, '') // 代码
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
            .replace(/^>\s+/gm, '') // 引用
            .replace(/^[-*+]\s+/gm, '') // 列表
            .replace(/^\d+\.\s+/gm, '') // 有序列表
            .replace(/\n{3,}/g, '\n\n') // 多余换行
            .trim();
    }

    async callAzureTTS(text, apiKey, voice, rate) {
        // 使用真实的Azure TTS API
        const region = document.getElementById('azure-region').value || 'eastus';
        const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

        // 构建SSML
        const ssml = `
        <speak version='1.0' xml:lang='zh-CN'>
            <voice xml:lang='zh-CN' name='${voice}'>
                <prosody rate='${rate}'>
                    ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </prosody>
            </voice>
        </speak>`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
                },
                body: ssml
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure TTS API 调用失败 (${response.status}): ${errorText}`);
            }

            const audioBuffer = await response.arrayBuffer();
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // 计算音频时长（估算）
            const duration = Math.max(text.length / 3, 1); // 假设每秒3个字

            return {
                audioUrl: audioUrl,
                audioBlob: audioBlob,
                duration: duration
            };
        } catch (error) {
            console.error('Azure TTS API 错误:', error);
            throw new Error(`语音合成失败: ${error.message}`);
        }
    }

    createSilentAudio(duration) {
        // 创建一个简单的静音音频文件用于演示
        const sampleRate = 44100;
        const numChannels = 1;
        const length = sampleRate * duration;
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);

        // WAV文件头
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // 静音数据（全零）
        for (let i = 0; i < length; i++) {
            view.setInt16(44 + i * 2, 0, true);
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    generateTimestampScript(text) {
        // 更精确的句子分割，考虑中文标点和语境
        const sentences = text.split(/[。！？.!?；;]/).filter(s => s.trim().length > 0);

        // 根据语速设置调整阅读速度（字符/秒）
        const rate = parseFloat(document.getElementById('speech-rate').value);
        let baseCharsPerSecond = 4; // 基础阅读速度：每秒4个字符

        // 根据语速调整
        if (rate <= 0.8) {
            baseCharsPerSecond = 3;  // 慢速
        } else if (rate >= 1.2) {
            baseCharsPerSecond = 5;  // 快速
        }

        baseCharsPerSecond = baseCharsPerSecond * rate;

        let currentTime = 0;
        const script = [];

        sentences.forEach((sentence, index) => {
            const trimmed = sentence.trim();
            if (!trimmed) return;

            // 计算这句话的持续时间
            let duration = trimmed.length / baseCharsPerSecond;

            // 为不同类型的句子调整时间
            if (trimmed.includes('，') || trimmed.includes(',')) {
                duration += 0.3; // 逗号停顿
            }
            if (trimmed.match(/[。！？.!?]/)) {
                duration += 0.5; // 句号停顿
            }

            // 最短持续时间1秒，最长不超过8秒
            duration = Math.max(1.0, Math.min(8.0, duration));

            const startTime = currentTime;
            currentTime += duration;

            // 添加句间停顿（除了最后一句）
            if (index < sentences.length - 1) {
                currentTime += 0.2;
            }

            script.push({
                start: this.formatTime(startTime),
                end: this.formatTime(currentTime - (index < sentences.length - 1 ? 0.2 : 0)),
                text: trimmed,
                startSeconds: startTime,
                endSeconds: currentTime - (index < sentences.length - 1 ? 0.2 : 0)
            });
        });

        return script;
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        // SRT格式：时:分:秒,毫秒
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }

    displayAudioResult(audioResult) {
        const resultArea = document.getElementById('audio-result');
        const audioElement = document.getElementById('generated-audio');
        const scriptPreview = document.getElementById('script-preview');

        audioElement.src = audioResult.audioUrl;

        // 显示脚本预览
        if (this.scriptData && this.scriptData.length > 0) {
            scriptPreview.innerHTML = '';

            this.scriptData.forEach((item, index) => {
                const scriptItem = document.createElement('div');
                scriptItem.className = 'script-item';
                scriptItem.id = `script-item-${index}`;

                const timestamp = document.createElement('div');
                timestamp.className = 'script-timestamp';
                timestamp.textContent = `${item.start} --> ${item.end}`;

                const text = document.createElement('div');
                text.className = 'script-text';
                text.textContent = item.text;

                scriptItem.appendChild(timestamp);
                scriptItem.appendChild(text);
                scriptPreview.appendChild(scriptItem);
            });
        }

        resultArea.style.display = 'block';
    }

    async generateTitles() {
        const content = document.getElementById('markdown-editor').value.trim();
        const apiKey = document.getElementById('deepseek-api-key').value.trim();
        const platforms = Array.from(document.querySelectorAll('.platform-selection input:checked'))
            .map(cb => cb.value);

        if (!content) {
            alert('请先输入文章内容');
            return;
        }

        if (!apiKey) {
            alert('请先配置 DeepSeek API Key');
            return;
        }

        if (platforms.length === 0) {
            alert('请选择至少一个平台');
            return;
        }

        this.showProgress('正在生成标题和标签...');

        try {
            const results = await this.callDeepSeekAPI(content, apiKey, platforms);
            this.displayTitlesResult(results);
        } catch (error) {
            console.error('生成标题失败:', error);
            alert('生成标题失败: ' + error.message);
        } finally {
            this.hideProgress();
        }
    }

    async callDeepSeekAPI(content, apiKey, platforms) {
        // 使用真实的DeepSeek API
        const endpoint = 'https://api.deepseek.com/v1/chat/completions';

        const platformDescriptions = {
            'xiaohongshu': '小红书：需要年轻化、种草向的标题，多使用表情符号，吸引年轻女性用户',
            'wechat': '微信公众号：需要专业、有深度的标题，突出价值和实用性',
            'bilibili': '哔哩哔哩：需要有趣、有梗的标题，吸引年轻人群，可以适当夸张'
        };

        const platformList = platforms.map(p => platformDescriptions[p]).join('\n');

        const prompt = `
基于以下文章内容，为指定的自媒体平台各生成1个吸引人的标题和5个相关标签。

文章内容：
${content}

目标平台：
${platformList}

请以JSON格式返回结果，格式如下：
{
    "xiaohongshu": {
        "title": "适合小红书的标题",
        "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
    },
    "wechat": {
        "title": "适合微信公众号的标题",
        "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
    },
    "bilibili": {
        "title": "适合B站的标题",
        "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
    }
}

注意：
1. 标题要具有吸引力，符合各平台特色
2. 标签要与文章内容相关，有助于提高曝光
3. 只返回JSON格式的数据，不要添加其他说明文字`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`DeepSeek API 调用失败 (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API返回格式错误');
            }

            const content_text = data.choices[0].message.content;

            // 解析JSON响应
            try {
                const results = JSON.parse(content_text);

                // 转换为前端需要的格式
                const formattedResults = {};
                platforms.forEach(platform => {
                    if (results[platform]) {
                        formattedResults[platform] = {
                            name: this.getPlatformName(platform),
                            title: results[platform].title,
                            tags: results[platform].tags
                        };
                    }
                });

                return formattedResults;
            } catch (parseError) {
                console.error('JSON解析错误:', parseError);
                console.log('API返回内容:', content_text);
                throw new Error('API返回内容解析失败，请检查API配置');
            }
        } catch (error) {
            console.error('DeepSeek API 错误:', error);
            throw new Error(`标题生成失败: ${error.message}`);
        }
    }

    getPlatformName(platform) {
        const names = {
            'xiaohongshu': '小红书',
            'wechat': '微信公众号',
            'bilibili': '哔哩哔哩'
        };
        return names[platform] || platform;
    }

    displayTitlesResult(results) {
        const resultArea = document.getElementById('titles-result');
        const container = document.getElementById('generated-titles');

        container.innerHTML = '';

        Object.entries(results).forEach(([platform, data]) => {
            const platformDiv = document.createElement('div');
            platformDiv.className = 'platform-titles';

            const platformTitle = document.createElement('h4');
            platformTitle.textContent = data.name;
            platformDiv.appendChild(platformTitle);

            // 标题区域
            const titleSection = document.createElement('div');
            titleSection.className = 'title-section';

            const titleItem = document.createElement('div');
            titleItem.className = 'title-item';

            const titleText = document.createElement('div');
            titleText.className = 'title-text';
            titleText.textContent = data.title;

            const copyTitleBtn = document.createElement('button');
            copyTitleBtn.className = 'btn btn-copy';
            copyTitleBtn.innerHTML = '📋 复制';
            copyTitleBtn.onclick = () => this.copyToClipboard(data.title);

            titleItem.appendChild(titleText);
            titleItem.appendChild(copyTitleBtn);
            titleSection.appendChild(titleItem);

            // 标签区域
            const tagsSection = document.createElement('div');
            tagsSection.className = 'tags-section';

            const tagsLabel = document.createElement('div');
            tagsLabel.className = 'tags-label';
            tagsLabel.textContent = '相关标签：';

            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'tags';

            data.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = '#' + tag;
                tagsContainer.appendChild(tagSpan);
            });

            const copyTagsBtn = document.createElement('button');
            copyTagsBtn.className = 'btn btn-copy';
            copyTagsBtn.innerHTML = '📋 复制';
            copyTagsBtn.onclick = () => this.copyToClipboard(data.tags.map(tag => '#' + tag).join(' '));

            tagsSection.appendChild(tagsLabel);
            tagsSection.appendChild(tagsContainer);
            tagsSection.appendChild(copyTagsBtn);

            platformDiv.appendChild(titleSection);
            platformDiv.appendChild(tagsSection);
            container.appendChild(platformDiv);
        });

        resultArea.style.display = 'block';
    }

    downloadAudio() {
        if (!this.audioData) {
            alert('请先生成音频');
            return;
        }

        const link = document.createElement('a');
        link.href = this.audioData.audioUrl;
        link.download = 'generated-audio.wav';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadScript() {
        if (!this.scriptData) {
            alert('请先生成音频和脚本');
            return;
        }

        let scriptText = '时间戳脚本\n\n';
        this.scriptData.forEach(item => {
            scriptText += `${item.start} --> ${item.end}\n${item.text}\n\n`;
        });

        // 同时生成SRT格式
        let srtText = '';
        this.scriptData.forEach((item, index) => {
            srtText += `${index + 1}\n`;
            srtText += `${item.start} --> ${item.end}\n`;
            srtText += `${item.text}\n\n`;
        });

        const blob = new Blob([srtText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'video-script.srt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    copyTitles() {
        const container = document.getElementById('generated-titles');
        if (!container.textContent.trim()) {
            alert('请先生成标题和标签');
            return;
        }

        const text = container.innerText;
        this.copyToClipboard(text);
    }

    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('已复制到剪贴板');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast('已复制到剪贴板');
        } catch (err) {
            this.showToast('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
    }

    showToast(message) {
        // 创建一个简单的提示
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 0.75rem 1rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MediaCreationTool();
});

// 全局函数：切换帮助内容显示
function toggleHelp(helpId) {
    const helpElement = document.getElementById(helpId);
    if (helpElement.style.display === 'none' || helpElement.style.display === '') {
        helpElement.style.display = 'block';
    } else {
        helpElement.style.display = 'none';
    }
}

// 添加真实的Azure TTS API调用示例
class AzureTTSService {
    constructor(apiKey, region = 'eastus') {
        this.apiKey = apiKey;
        this.region = region;
        this.endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    }

    async synthesizeSpeech(text, voice = 'zh-CN-XiaoxiaoNeural', rate = '1.0') {
        const ssml = `
        <speak version='1.0' xml:lang='zh-CN'>
            <voice xml:lang='zh-CN' name='${voice}'>
                <prosody rate='${rate}'>
                    ${text}
                </prosody>
            </voice>
        </speak>`;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
                },
                body: ssml
            });

            if (!response.ok) {
                throw new Error(`TTS API 调用失败: ${response.status}`);
            }

            const audioBuffer = await response.arrayBuffer();
            return new Blob([audioBuffer], { type: 'audio/mpeg' });
        } catch (error) {
            throw new Error(`TTS 服务错误: ${error.message}`);
        }
    }
}

// 添加真实的DeepSeek API调用示例
class DeepSeekService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.endpoint = 'https://api.deepseek.com/v1/chat/completions';
    }

    async generateTitlesAndTags(content, platforms) {
        const prompt = `
        基于以下文章内容，为指定的自媒体平台生成吸引人的标题和相关标签。

        文章内容：
        ${content}

        请为以下平台生成内容：
        ${platforms.map(p => this.getPlatformDescription(p)).join('\n')}

        请以JSON格式返回结果，格式如下：
        {
            "platform_code": {
                "titles": ["标题1", "标题2", "标题3"],
                "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
            }
        }`;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`DeepSeek API 调用失败: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // 解析JSON响应
            try {
                return JSON.parse(content);
            } catch (parseError) {
                throw new Error('API返回格式错误');
            }
        } catch (error) {
            throw new Error(`DeepSeek 服务错误: ${error.message}`);
        }
    }

    getPlatformDescription(platform) {
        const descriptions = {
            'xiaohongshu': '小红书 - 需要年轻化、种草向的标题，多使用表情符号',
            'wechat': '微信公众号 - 需要专业、有深度的标题，突出价值',
            'bilibili': '哔哩哔哩 - 需要有趣、有梗的标题，吸引年轻人群'
        };
        return descriptions[platform] || platform;
    }
}