import 'dotenv/config'

const config = {
    apiKey: process.env.API_KEY,
    uploadPath: process.env.UPLOAD_PATH,
    downloadPath: process.env.DOWNLOAD_PATH,
    promptText: process.env.PROMT_TEXT
}

export { config }