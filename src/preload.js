const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    generateDocx: (data) => ipcRenderer.send('generate-docx', data),
    onDocxGenerated: (callback) => ipcRenderer.on('docx-generated', (event, filePath) => callback(filePath)),
});