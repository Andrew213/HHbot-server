import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "yandex",
  host: "smtp.yandex.ru",
  port: 465,
  auth: {
    user: "hhbotmailer@yandex.ru", // Адрес отправителя
    pass: process.env.YANDEX_PASS, // Пароль приложения
  },
});

const sendMail = (
  email: string,
  stack: { name: string; info: string; link: string }[]
) => {
  const mailHtml = `
    <h2>Вакансии, на которые был отправлен отклик: </h2>
    <ul style="list-style-type: none">
    ${stack
      .map(({ name, info, link }, i) => {
        const isLast = i === stack.length - 1;
        return `
        <li style="${
          !isLast
            ? "padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid grey;"
            : ""
        }">
          <h4 style="margin-bottom: 5px; padding:0">${name}</h4>
          <span style="display: block; margin-bottom: 5px">Описание: ${info}</span>
          <a href="${link}" >Открыть вакансию на HeadHunter</a>
        </li>`;
      })
      .join("")}
      </ul>`;

  transporter.sendMail({
    from: "hhbotmailer@yandex.ru",
    to: email,
    subject: "Eжедневная рассылка",
    html: mailHtml,
  });
};

export default sendMail;
