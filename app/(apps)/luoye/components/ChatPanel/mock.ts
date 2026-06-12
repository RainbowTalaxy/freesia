// ChatPanel 本地调试配置；用于常亮展示附件上传和拖拽状态样式。
export const CHAT_PANEL_MOCK = {
    attachmentUpload: {
        enabled: false,
        dragging: false,
        id: 'mock-uploading-attachment',
        previewUrl:
            'https://blog.talaxy.cn/statics/temp/luoye/2026-06-12-14-03-16-116-5d33d172-d355-4062-b16f-0753bb743365.jpg',
        name: 'mock-uploading.png',
        mimeType: 'image/png',
        size: 1024,
    },
} as const;
