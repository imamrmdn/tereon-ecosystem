import { CallbackInfo } from '..';

const cancelKeyboardMarkup = {
  parse_mode: 'Markdown',
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: '✖️ Cancel',
          callback_data: JSON.stringify({
            command: CallbackInfo.CANCEL,
          }),
        },
      ],
    ],
  }),
};

const startKeyboardMarkup = [
  // [
  //   {
  //     text: '🎭 Cartoon',
  //     callback_data: JSON.stringify({
  //       command: CallbackInfo.CARTOON,
  //     }),
  //   },
  // ],
  [
    {
      text: 'Launch VPN Apps',
      callback_data: JSON.stringify({
        command: CallbackInfo.MEME,
      }),
    },
  ],
  // [
  //   {
  //     text: '🔀 Remove Background',
  //     callback_data: JSON.stringify({
  //       command: CallbackInfo.REMOVE_BG,
  //     }),
  //   },

  //   {
  //     text: '🌇 Colorize',
  //     callback_data: JSON.stringify({
  //       command: CallbackInfo.COLORIZE,
  //     }),
  //   },
  // ],
  // [
  //   {
  //     text: '🏦 Trading Companion',
  //     callback_data: JSON.stringify({
  //       command: CallbackInfo.SOON_FITUR,
  //     }),
  //   },

  //   {
  //     text: '💸 Price Prediction',
  //     callback_data: JSON.stringify({
  //       command: CallbackInfo.SOON_FITUR,
  //     }),
  //   },
  // ],
  [
    {
      text: '👨‍🚀 Market Research Analyst AI Agents',
      callback_data: JSON.stringify({
        command: CallbackInfo.SOON_FITUR,
      }),
    },
  ],
  [
    {
      text: '💻 GPU Works',
      callback_data: JSON.stringify({
        command: CallbackInfo.SOON_FITUR,
      }),
    },
  ],
  [
    {
      text: '🌍 Socials',
      callback_data: JSON.stringify({
        command: CallbackInfo.SOCIALS,
      }),
    },
    // {
    //   text: '💳 Buy Credits',
    //   callback_data: JSON.stringify({
    //     command: CallbackInfo.CREDITS,
    //   }),
    // },
  ],
  [
    {
      text: '📄 Description',
      callback_data: JSON.stringify({
        command: CallbackInfo.DESC,
      }),
    },
  ],
];

const socialsKeyboardMarkup = [
  [
    {
      text: '💻 Website',
      url: 'https://1001mg.fun/',
    },
  ],
  [
    {
      text: '📱 Telegram',
      url: 'https://t.me/onethousandonemg',
    },
    {
      text: '🕊 Twitter / X',
      url: 'https://x.com/1thousand1MG',
    },
  ],
  [
    {
      text: '🔙 Back',
      callback_data: JSON.stringify({
        command: CallbackInfo.BACK,
      }),
    },
  ],
];

export const keyboardMarkup = {
  cancel: cancelKeyboardMarkup,
  start: startKeyboardMarkup,
  socials: socialsKeyboardMarkup,
};
