require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');
const Scheduler = require('node-schedule');

let mee6_api = 'https://mee6.xyz/api/plugins/levels/leaderboard/';

const getLeaderboard = () => {
  return new Promise(async (res, rej) => {
    try {
      let fetch_str = `${mee6_api}${process.env.SERVER_ID}`
      let response = (await axios.get(fetch_str)).data;
      res({ 'success': response, 'error': 0 });
    }
    catch (e) { res({ 'success': -1, 'error': e }) }
  });
};

const isInPosition = (data, user, pos) => {
  let user_index = null;
  for (let i = 0; i < data.players.length; i++) {
    if (data.players[i].username === user) {
      user_index = i;
      break;
    }
  }
  return user_index >= pos;
}

const createTransport = data => {
  return nodemailer.createTransport(data);
};

const useTransport = (transporter, data) => {
  return new Promise(async (res, rej) => {
    let result = null;
    try {
      result = await transporter.sendMail(data);
      res({ 'success': 1, 'error': 0 });
    }
    catch (e) { console.log(e); res({ 'success': -1, 'error': e }) }
  });
};

(() => {
  let email_info = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: (process.env.EMAIL_PORT === '465') ? true : false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
  let email_data = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: process.env.EMAIL_SUB,
    text: "Your score has dropped below your desired position!"
  };
  let transporter = createTransport(email_info);
  let schedule = Scheduler.scheduleJob(process.env.CRON_STR, async () => {
    console.log('Running..');
    let leaderboard = (await getLeaderboard()).success;
    let in_position = isInPosition(leaderboard, process.env.USER, process.env.POS);
    console.log(in_position)
    if (!in_position) await useTransport(transporter, email_data);
  });
})();
