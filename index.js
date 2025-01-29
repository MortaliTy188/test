const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeightRule, HeadingLevel} = require('docx');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});


ipcMain.on("generate-docx", (event, { isMobileValid, isWorkPhoneValid, isEmailValid }) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: "Отчет о проверке данных",
                        heading: HeadingLevel.TITLE,
                    }),
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Проверка данных")],
                                        width: { size: 5000, type: WidthType.DXA },
                                    }),
                                    new TableCell({
                                        children: [new Paragraph("Результат")],
                                        width: { size: 5000, type: WidthType.DXA },
                                    }),
                                ],
                            })
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Проверка мобильного телефона")],
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph(isMobileValid ? "True" : "False"),
                                        ],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Проверка рабочего телефона")],
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph(isWorkPhoneValid ? "True" : "False"),
                                        ],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("Проверка электронной почты")],
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph(isEmailValid ? "True" : "False"),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    // Save the document
    Packer.toBuffer(doc).then((buffer) => {
        const filePath = path.join(app.getPath("desktop"), "validation_report.docx");
        fs.writeFileSync(filePath, buffer);
        event.sender.send("docx-generated", filePath);
    });
});