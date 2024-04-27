import { Request, Response } from "express";
import sendMail from "../../../utils/mailer";
import { api } from "..";
import { agenda } from "../../..";

const stack: { name: string; info: string; link: string }[] = [];

const schedule = async (req: Request, res: Response) => {
  const { hours, minutes, count, resume_id, message, email } = req.body;

  // 1. Смотрю есть ли уже запущенная таска
  const job = await agenda.jobs({ name: resume_id });

  if (!job.length) {
    // 2. Если нет, то создаю таску с названием айди пользователя

    agenda.define(resume_id, async (job, done) => {
      try {
        // 3. Получаю нужное кол-во вакансий для этого резюме
        const response = await api
          .getData(
            `resumes/${resume_id}/similar_vacancies?page=0&per_page=${count}`
          )
          .then((response) => response.data)
          .catch((err) => {
            job.fail(err.data);
            done();
            res.status(403).send(err);
          });

        // 4. Итерируюсь по вакансиям и отправляю отклик (так же как и на клиенте)
        for (let i = 0; i < response.items.length; i++) {
          const vacancy = response.items[i];

          if (
            !vacancy.has_test &&
            ((vacancy.response_letter_required && message) ||
              !vacancy.response_letter_required)
          ) {
            const formData = new FormData();

            formData.append("vacancy_id", `${vacancy.id}`);
            formData.append("resume_id", resume_id);

            if (message) {
              formData.append("message", message);
            }

            await api
              .postData("negotiations", formData)
              .then(() => {
                // 5. Успешные отклики сохраняю в массив
                stack.push({
                  name: vacancy.name,
                  info: vacancy.snippet.requirement,
                  link: vacancy.alternate_url,
                });
              })
              .catch((err) => {
                // Если отклик с ошибкой то сохраняю в бд.
                job.fail(err.data);
                console.log(`ERR IN SEND RESPONSE `, err);
              });
          }
        }
      } catch (err) {
        job.fail(err.data);
        console.log(`ERR IN AGENDA`);
      }

      job.save();
      done();
    });

    // 6. Запуск таски каждый день в указанное время

    await agenda.every(`${minutes} ${hours} * * *`, resume_id, req.body, {
      timezone: "Europe/Moscow",
    });

    agenda.on("complete", (job) => {
      // 7. По завршению таски и если есть отклики то отправляю сообщение на почту
      if (job.attrs.name === resume_id && stack.length) {
        sendMail(email, stack);
      }
    });

    async function graceful() {
      await agenda.stop();
      await agenda.cancel({ name: resume_id });
      process.exit(0);
    }

    process.on("SIGTERM", graceful);
    process.on("SIGINT", graceful);

    res.status(200).send("Автоотклики успешно запланированны");
  } else {
    res.status(409).send("Автоотклики уже запланированны");
  }
};

export default schedule;
