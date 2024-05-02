import nodemailer from 'nodemailer';
import { stackT } from '../router/api/schedule/schedule';

const transporter = nodemailer.createTransport({
    service: 'yandex',
    host: 'smtp.yandex.ru',
    port: 465,
    auth: {
        user: 'hhbotmailer@yandex.ru', // Адрес отправителя
        pass: process.env.YANDEX_PASS // Пароль приложения
    }
});

const sendMail = (email: string, stack: stackT[]) => {
    const mailHtml = `
    <h2>Вакансии, на которые был отправлен отклик: </h2>
    <ul style="list-style-type: none">
    ${stack
        .map(({ name, info, link, employer }, i) => {
            const isLast = i === stack.length - 1;
            return `
        <li style="${
            !isLast
                ? 'padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid grey;'
                : ''
        }">
          <h4 style="margin-bottom: 5px; padding:0">${name}</h4>
          <a href="${employer.link}" style="color:grey;" >${employer.name}</a>
          ${
              info.responsibility
                  ? ` <span style="display: block; margin-bottom: 5px; margin-top: 5px">
                      Описание: ${info.responsibility}
                  </span>`
                  : ''
          }

          ${
              info.requirement
                  ? `   <span style="display: block; margin-bottom: 5px">Требования: ${info.requirement}</span>`
                  : ''
          }
      
          <a href="${link}" >Открыть вакансию на HeadHunter</a>
        </li>`;
        })
        .join('')}
      </ul>`;

    transporter.sendMail({
        from: 'hhbotmailer@yandex.ru',
        to: email,
        subject: 'Eжедневная рассылка',
        html: mailHtml
    });
};

export default sendMail;
