import { Request, Response } from 'express';
import sendMail from '../../../utils/mailer';
import { agenda } from '../../..';
import axios from 'axios';
import { Job } from 'agenda';

export type stackT = {
    name: string;
    info: {
        requirement?: string;
        responsibility?: string;
    };
    link: string;
    employer: { name: string; link: string };
};

const schedule = async (req: Request, res: Response) => {
    const { hours, minutes, resume_id, message, email } = req.body;

    let queue = [];

    // 1. Смотрю есть ли уже запущенная таска
    const job = await agenda.jobs({ name: resume_id });

    if (!job.length) {
        // 2. Если нет, то создаю таску с названием айди пользователя

        agenda.define(resume_id, async (job, done) => {
            try {
                let page = 0;

                let stack: stackT[] = [];

                // 3. Получаю 300 вакансий. Чтобы при максимально возможных запланированных откликах меньше был шанс того что вакансий без тестового задания будет меньше
                while (page < 3) {
                    const response = await axios
                        .get(
                            `https://api.hh.ru/resumes/${resume_id}/similar_vacancies?page=${page}&per_page=100`,
                            {
                                headers: {
                                    // 'Content-Type': 'application/json',
                                    'Content-Type': 'multipart/form-data',

                                    'User-Agent':
                                        'HHbot (a.kochanov31@yandex.ru)',
                                    Authorization: `Bearer ${req.cookies.access_token}`
                                },
                                withCredentials: true
                            }
                        )
                        .then(response => response.data)
                        .catch(err => {
                            console.log(
                                `ERR IN FILTER VACANCIES BY HAS_TEST`,
                                err
                            );
                            job.fail(err.data);
                            res.status(403).send(err);
                        });

                    // 4. фильтрую вакансии по тестовому
                    const vanacies_with_no_test = response.items.filter(
                        el => !el.has_test
                    );

                    queue = queue.concat(vanacies_with_no_test);

                    page++;
                }

                // 5. Итерируюсь по вакансиям и отправляю отклик (так же как и на клиенте)
                for (let i = 0; i < req.body.count; i++) {
                    // 6. Беру вакансию из очереди
                    const vacancy = queue[i];

                    if (
                        (vacancy.response_letter_required && message) ||
                        !vacancy.response_letter_required
                    ) {
                        const formData = new FormData();

                        formData.append('vacancy_id', `${vacancy.id}`);
                        formData.append('resume_id', resume_id);

                        if (message) {
                            formData.append('message', message);
                        }

                        await axios
                            .post('https://api.hh.ru/negotiations', formData, {
                                headers: {
                                    // 'Content-Type': 'application/json',
                                    'Content-Type': 'multipart/form-data',

                                    'User-Agent':
                                        'HHbot (a.kochanov31@yandex.ru)',
                                    Authorization: `Bearer ${req.cookies.access_token}`
                                },
                                withCredentials: true
                            })
                            .then(res => {
                                // 5. Успешные отклики сохраняю в массив
                                if (res.status === 201 || res.status === 303) {
                                    stack.push({
                                        name: vacancy.name,
                                        info: {
                                            requirement:
                                                vacancy.snippet.requirement ||
                                                '',
                                            responsibility:
                                                vacancy.snippet
                                                    .responsibility || ''
                                        },
                                        link: vacancy.alternate_url,
                                        employer: {
                                            name: vacancy.employer.name,
                                            link: vacancy.employer.alternate_url
                                        }
                                    });
                                }
                            })
                            .catch(err => {
                                // Если отклик с ошибкой то сохраняю в бд.
                                job.fail(err.data);
                                console.log(`ERR IN SEND RESPONSE `, err);
                            });
                    }
                }
                sendMail(email, stack);
            } catch (err) {
                job.fail(err.data);
                console.log(`ERR IN AGENDA`, err);
            }
            await job.save();
            done();
        });

        // 6. Запуск таски каждый день в указанное время

        await agenda.every(`${minutes} ${hours} * * *`, resume_id, req.body, {
            timezone: 'Europe/Moscow'
        });

        async function graceful() {
            await agenda.stop();
            await agenda.cancel({ name: resume_id });
            process.exit(0);
        }

        process.on('SIGTERM', graceful);
        process.on('SIGINT', graceful);

        res.status(200).send('Автоотклики успешно запланированны');
    } else {
        res.status(409).send('Автоотклики уже запланированны');
    }
};

export default schedule;
