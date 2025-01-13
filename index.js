const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: `${__dirname}/src/renderer.js`,
        },
    });

    mainWindow.loadFile(`${__dirname}/src/index.html`);
    mainWindow.webContents.openDevTools(); // Уберите эту строку для финальной версии.
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
