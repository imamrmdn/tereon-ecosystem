import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
//
import * as TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import * as path from 'path';
import * as requestPromise from 'request-promise';
//
import {
  CallbackInfo,
  commingSoon,
  detectNumber,
  detectTextMeme,
  generateNumber0to7,
  textInfo,
} from './shared/utils';

import { keyboardMarkup } from './shared/utils/keyboard-markup';

import 'dotenv/config';

// replace the value below with the Telegram token you receive from @BotFather
const token_bot = process.env.TOKEN_BOT;
const apiKey = process.env.API_KEY;
const apiKeyMeme = process.env.API_KEY_MEME;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token_bot, { polling: true });

//
let maxUsagePerChat = 3;
let usageCount = {};

// Inisialisasi hitungan penggunaan untuk setiap jenis fitur
['colorize', 'cartoon'].forEach((feature) => {
  usageCount[feature] = {};
});

//
function resetUsageCount() {
  setInterval(
    () => {
      Object.keys(usageCount).forEach((feature) => {
        Object.keys(usageCount[feature]).forEach((chatId) => {
          usageCount[feature][chatId] = 0;
        });
      });
    },
    24 * 60 * 60 * 1000,
  ); // Reset every 24 hours
}

// Function to ensure the directory exists
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

//
async function processImageAndSendToUser(
  fileUrl: string,
  msg,
  chatId,
  caption,
) {
  //
  let cond = false;
  let apiUrl = '';

  //
  if (caption === '/colorize') {
    apiUrl = `${process.env.API_URL_COLORIZE}`;
    cond = true;
  }

  //
  if (caption === '/cartoon') {
    apiUrl = `${process.env.API_URL_CARTOON}`;
    cond = true;
  } else if (caption.includes('/cartoon&')) {
    const match = detectNumber(caption);
    const numAfterSymbol = parseInt(match[1], 10); // Mengonversi string angka menjadi bilangan bulat
    if (numAfterSymbol >= 1 && numAfterSymbol <= 10) {
      apiUrl = `${process.env.API_URL_CARTOON}?cartoonType=${numAfterSymbol}`;
      cond = true;
    } else {
      cond = false;
    }
  }

  //
  try {
    //
    if (cond) {
      const featureKey = caption.split('&')[0]; // Ambil jenis fitur tanpa argumen tambahan

      // Pastikan usageCount[featureKey] sudah terdefinisi
      if (!usageCount[featureKey]) {
        usageCount[featureKey] = {};
      }
      const currentUsage = (usageCount[featureKey][chatId] || 0) + 1;

      console.log({ log: 'before currentUsage:', chatId, currentUsage });
      usageCount[featureKey][chatId] = currentUsage;
      console.log({
        log: 'after currentUsage:',
        chatId,
        currentUsage: usageCount[featureKey][chatId],
      });
      if (usageCount[featureKey][chatId] <= maxUsagePerChat) {
        //
        console.log({ log: 'waiting to process' });
        const cutoutResponse = await requestPromise.post({
          url: apiUrl,
          formData: {
            file: requestPromise(fileUrl),
          },
          headers: {
            APIKEY: apiKey,
          },
          encoding: null,
        });
        //
        const cutoutDirectory = `${__dirname}/image/`;
        ensureDirectoryExists(cutoutDirectory);

        // Specify the image file path
        const cutoutImagePath = path.join(cutoutDirectory, 'your-image.jpg');

        // console.log({ log: cutoutResponse.toString('utf8')}) //<-- debug response failed or not

        // Handle Image processing failed!
        if (cutoutResponse.toString('utf8').includes('Processing failed')) {
          bot.sendMessage(chatId, textInfo.catchErrorText);
          return;
        }

        // Handle credits balance
        if (cutoutResponse.toString('utf8').includes('Insufficient credits')) {
          bot.sendMessage(chatId, textInfo.catchBalanceText);
          return;
        }

        // Send the processed image back to the user
        fs.writeFileSync(cutoutImagePath, cutoutResponse);
        bot.sendPhoto(chatId, cutoutImagePath, {
          caption: 'Result your photo',
        });
        console.log({ log: 'finish process' });
      } else {
        console.log({
          log: {
            uname: `${msg.from.first_name} - ${msg.from.username}`,
            msg: 'caught limit!',
          },
        });
        bot.sendMessage(chatId, textInfo.limitText);
      }
    } else {
      bot.sendMessage(chatId, textInfo.errorCondition);
    }
  } catch (error) {
    console.error('Something Went Wrong, Telegram API Error:', error);
    bot.sendMessage(chatId, textInfo.catchErrorText);
    return;
  }
}

async function processTextToMeme(chatId, match, msg) {
  //
  try {
    const apiUrlMeme = process.env.API_URL_MEME;
    let text = '';
    let waitingMessage1;
    //
    if (!match[1]) text = 'default';
    //
    if (match[1]) text = match[1];

    bot
      .sendMessage(chatId, 'Creating your meme... It’ll be worth the wait! 🗿')
      .then((message) => {
        waitingMessage1 = message.message_id;
      });
    //
    const memeResponse = await requestPromise.post({
      url: apiUrlMeme,
      json: true,
      body: { text },
      headers: {
        Authorization: `Bearer ${apiKeyMeme}`, // Menyertakan bearer token dalam header
        'Content-Type': 'application/json', // Menetapkan jenis konten sebagai JSON
      },
      encoding: null,
    });

    if (waitingMessage1) {
      bot.deleteMessage(chatId, waitingMessage1);
    }
    //
    bot.sendPhoto(chatId, memeResponse['memes'][generateNumber0to7()], {
      caption: '🟢 Result your photo',
    });
  } catch (error) {
    console.log({ log: error });
    bot.sendMessage(
      chatId,
      `🔴 We're experiencing high traffic at the moment. Please try again shortly.`,
    );
    return;
  }
}

//
async function main() {
  //
  const app = await NestFactory.create(AppModule);
  //
  resetUsageCount();
  //
  app.enableCors({
    origin: '*', // replace with your allowed origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      // 'Origin,Content-Type,Authorization,Accept,User-Agent,Cache-Control,Pragma,x-api-key',
      'x-api-key',
    credentials: true,
    exposedHeaders: 'Content-Length',
    maxAge: 43200, // 12 hours
  });

  //
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Listen for any kind of message. There are different kinds of message
  bot.on('message', async (msg) => {
    //
    let messageText = msg.text;
    const chatId = msg.chat.id;
    let match;

    if (msg.caption) {
      //detect number
      match = detectNumber(msg.caption);
    }

    // new feature meme generator
    const matchMeme = detectTextMeme(msg.text);

    //
    if (messageText === '/start') {
      // send a message to the chat acknowledging receipt of their message
      const WEB_APP_URL = 'https://tereon-app-ecosystem.vercel.app/';

      bot.sendMessage(chatId, textInfo.welcomeLaunch, {
        parse_mode: 'Markdown',
        // reply_markup: JSON.stringify({
        //   inline_keyboard: keyboardMarkup.start,
        // }),
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Launch', web_app: { url: WEB_APP_URL } }],
          ],
        },
      });
    } else {
      bot.sendMessage(
        chatId,
        'There are no commands that you execute or invalid command',
      );
    }

    // else if (matchMeme) {
    //   await processTextToMeme(chatId, matchMeme, msg);
    // }

    // else if (
    //   ((msg.photo || msg.document) &&
    //     msg.caption &&
    //     (msg.caption === '/cartoon' || msg.caption === '/colorize')) ||
    //   (match && match[1])
    // ) {
    //   //
    //   const caption = msg.caption;
    //   const photoId = msg.photo
    //     ? msg.photo[msg.photo.length - 1].file_id
    //     : msg.document.file_id;
    //   //
    //   if (msg.photo) {
    //     //
    //     bot.getFile(photoId).then(async (fileInfo) => {
    //       const fileUrl = `https://api.telegram.org/file/bot${token_bot}/${fileInfo.file_path}`;
    //       // Process the image and send it back to the user
    //       await processImageAndSendToUser(fileUrl, msg, chatId, caption);
    //     });
    //   }

    //   if (msg.document) {
    //     if (
    //       msg.document.mime_type === 'image/jpeg' &&
    //       msg.document.mime_type === 'image/png'
    //     ) {
    //       bot.getFile(photoId).then(async (fileInfo) => {
    //         const fileUrl = `https://api.telegram.org/file/bot${token_bot}/${fileInfo.file_path}`;
    //         // Process the image and send it back to the user
    //         await processImageAndSendToUser(fileUrl, msg, chatId, caption);
    //       });
    //     } else {
    //       bot.sendMessage(chatId, 'Invalid format image');
    //     }
    //   }
    // } else {
    //   if (msg.photo || msg.document) {
    //     const photoId = msg.photo ? msg.photo[0].file_id : msg.document.file_id;
    //     if (msg.photo) {
    //       bot.sendPhoto(chatId, photoId, {
    //         caption: 'Please upload your photo with right commands',
    //       });
    //     }
    //     if (msg.document) {
    //       if (msg.document.mime_type !== 'image/jpeg') {
    //         //
    //         bot.sendMessage(chatId, 'Invalid format image');
    //       } else {
    //         bot.sendDocument(chatId, photoId, {
    //           caption: 'Please upload your photo with right commands',
    //         });
    //       }
    //     }
    //   } else {

    //     //
    //     if (match) {
    //       //
    //       await processTextToMeme(chatId, match, msg);
    //     } else {
    //       //I use bot command regex to prevent bot from miss understanding any user messages contain 'clear'
    //       bot.sendMessage(
    //         chatId,
    //         'There are no commands that you execute or invalid command',
    //       );
    //     }
    //   }
    // }
  });

  //
  bot.on('callback_query', async (callbackQuery) => {
    const query = callbackQuery;
    const message = query.message;

    const chatId: number = message.chat.id;
    const messageId: number = message.message_id;
    const data = JSON.parse(callbackQuery.data);

    switch (data.command) {
      // case CallbackInfo.CARTOON:
      //   bot.sendMessage(chatId, textInfo.commandCartoon);
      //   break;
      case CallbackInfo.MEME:
        bot.sendMessage(chatId, textInfo.commandMeme);
        break;
      // case CallbackInfo.REMOVE_BG:
      //   bot.sendMessage(chatId, commingSoon('Remove Background Photo'), keyboardMarkup.cancel);
      //   break;
      // case CallbackInfo.COLORIZE:
      //   bot.sendMessage(chatId, textInfo.commandColorize);
      //   break;
      case CallbackInfo.SOON_FITUR:
        bot.sendMessage(chatId, textInfo.soon_feature, keyboardMarkup.cancel);
        break;
      case CallbackInfo.GUID:
        bot.sendMessage(chatId, textInfo.guidline, keyboardMarkup.cancel);
        break;
      case CallbackInfo.SOCIALS:
        bot.editMessageReplyMarkup(
          {
            inline_keyboard: keyboardMarkup.socials,
          },
          {
            chat_id: chatId,
            message_id: message.message_id,
          },
        );
        break;
      case CallbackInfo.DESC:
        bot.sendMessage(chatId, textInfo.description, keyboardMarkup.cancel);
        break;
      case CallbackInfo.BACK:
        bot.editMessageReplyMarkup(
          {
            inline_keyboard: keyboardMarkup.start,
          },
          {
            chat_id: chatId,
            message_id: message.message_id,
          },
        );
        break;
      case CallbackInfo.CANCEL:
        if (chatId && messageId) {
          bot.deleteMessage(chatId, messageId);
        }
        break;
      default:
        break;
    }
  });

  await app.listen(9090);
  console.log(`chronicle bot is running on: ${await app.getUrl()}`);
}
main();
