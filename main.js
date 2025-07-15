const { app, BrowserWindow, Menu, MenuItem, ipcMain } = require('electron')
const path = require('path')
const remote = require('@electron/remote/main')
remote.initialize()

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  mainWindow.loadFile('index.html')
  setupContextMenu(mainWindow.webContents)

  // Obsługa nowych okien
  ipcMain.on('create-new-tab', (event, url) => {
    const newWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })
    newWindow.loadURL(url)
  })
}

function setupContextMenu(webContents) {
  webContents.on('context-menu', (event, params) => {
    const menu = new Menu()

    // Standardowe opcje edycji
    if (params.editFlags.canUndo) menu.append(new MenuItem({ role: 'undo' }))
    if (params.editFlags.canRedo) menu.append(new MenuItem({ role: 'redo' }))
    if (params.editFlags.canCut) menu.append(new MenuItem({ role: 'cut' }))
    if (params.editFlags.canCopy) menu.append(new MenuItem({ role: 'copy' }))
    if (params.editFlags.canPaste) menu.append(new MenuItem({ role: 'paste' }))
    if (params.editFlags.canDelete) menu.append(new MenuItem({ role: 'delete' }))
    if (params.editFlags.canSelectAll) menu.append(new MenuItem({ role: 'selectAll' }))

    // Separator jeśli były opcje edycji
    if (menu.items.length > 0) menu.append(new MenuItem({ type: 'separator' }))

    // Opcje specyficzne dla treści
    if (params.linkURL) {
      menu.append(new MenuItem({
        label: 'Otwórz link w nowej karcie',
        click: () => { webContents.send('open-new-tab', params.linkURL) }
      }))
      menu.append(new MenuItem({
        label: 'Kopiuj adres linku',
        click: () => { require('electron').clipboard.writeText(params.linkURL) }
      }))
    }

    if (params.hasImageContents) {
      menu.append(new MenuItem({
        label: 'Zapisz obraz',
        click: () => { webContents.downloadURL(params.srcURL) }
      }))
    }

    // Narzędzia deweloperskie
    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(new MenuItem({ role: 'toggleDevTools' }))
    menu.append(new MenuItem({ role: 'reload' }))

    menu.popup()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})