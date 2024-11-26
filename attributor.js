import { config } from '../openai_attributor/config/config.js';
import fs from 'fs';
import path from 'path';
import OpenAI  from 'openai';
import { createObjectCsvWriter } from 'csv-writer';

const folderPath = config.uploadPath; // Путь к папке с изображениями
const csvFilePath = config.downloadPath; // Путь к CSV файлу
const promptTemplate = config.promptText; // Передаваемый промт

// Настройка CSV writer
const writer = createObjectCsvWriter({
  path: csvFilePath,
  header: [
    { id: 'filename', title: 'Имя файла' },
    { id: 'title', title: 'Заголовок' },
    { id: 'description', title: 'Описание' },
    { id: 'keywords', title: 'Ключевые слова' },
    { id: 'category', title: 'Категория' },
    { id: 'release', title: 'Имя релиза' }
  ]
});

// Инициализация OpenAI API
const openai = new OpenAI({apiKey: config.apiKey});

// Функция для обработки изображения и получения описания и ключевых слов
async function processImages() {
  try {
    // Получаем список файлов из папки с изображениями
    const files = fs.readdirSync(folderPath).filter(file => /\.(jpg|jpeg)$/.test(file));
    const records = [];

    let counter = 0;

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

      // Отправка запроса на API для анализа изображения
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptTemplate },
              { type: 'image_url', 
                image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: "low"
                }
              }
            ]
          }
        ]
      });


      // Логируем полный ответ для отладки
      // console.log('Полный ответ API:', JSON.stringify(response));


      // Извлечение содержимого сообщения (description и keywords)
      const messageContent = response.choices[0].message.content;
      // console.log('Ответ контент:', messageContent);

      // Используем регулярные выражения для разделения описания и ключевых слов
      const descriptionMatch = messageContent.match(/\*\*description:\*\*\s*([^\n]*)/i);
      const keywordsMatch = messageContent.match(/\*\*keywords:\*\*\s*([^\n]*)/i);

      const description = descriptionMatch ? descriptionMatch[1].trim() : 'Описание не найдено';
      const keywords = keywordsMatch ? keywordsMatch[1].trim() : 'Ключевые слова не найдены';

      console.log(`Обработано изображение: ${file}`);
      counter++;

      // Добавляем данные в массив для записи в CSV
      records.push({
        filename: file,
        title: description,
        description: description,
        keywords: keywords
      });
    }

    // Запись данных в CSV файл
    console.log(`Всего обработано файлов: ${counter}`);
    await writer.writeRecords(records);
    console.log('CSV файл успешно создан');
  } catch (error) {
    console.error('Ошибка при обработке изображений:', error.message);
  }
}

// Запуск функции обработки
processImages();