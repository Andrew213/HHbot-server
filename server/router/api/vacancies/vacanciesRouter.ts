import { Request, Response, Router } from 'express';
import { vacanciesApiServer } from './vacancies';
import { api } from '..';
import axios from 'axios';

export function vacanciesRouter(router: Router) {
    //отправить отклик

    router.post(
        '/api/vacancies/negotiations',
        async (request: Request, response: Response) => {
            const { vacancy_id, resume_id } = request.body;

            const formData = new FormData();
            formData.append('vacancy_id', `${vacancy_id}`);
            formData.append('resume_id', resume_id);

            if (request.body.message) {
                formData.append('message', request.body.message);
            }

            await vacanciesApiServer
                .sendNegotiations(formData)
                .then(res => {
                    response.status(res.status).send(res.data);
                })
                .catch(({ status, data }) => {
                    response.status(status).send(data);
                });
        }
    );

    //поиск по всем вакансиям
    router.get(
        '/api/vacancies/search',
        async (request: Request, response: Response) => {
            const { text, page } = request.query;

            await vacanciesApiServer
                .searchVacancies(text as string, page as unknown as number)
                .then(({ status, data }) => {
                    response.status(status).send(data);
                })
                .catch(({ status, data }) => {
                    response.status(status).send(data);
                });
        }
    );

    // получаю список вакансий
    router.get(
        '/api/vacancies',
        async (request: Request, response: Response) => {
            const { resume_id, page, per_page } = request.query;
            const filterRelations = [
                'got_response',
                'got_invitation',
                'got_rejection'
            ];
            await vacanciesApiServer
                .getSimilarVacancies(
                    resume_id as string,
                    page as unknown as number,
                    per_page as unknown as number
                )
                .then(({ status, data }) => {
                    data.items = data.items.filter(el => {
                        let required = true;
                        for (let i = 0; i < el.relations.length; i++) {
                            const relation = el.relations[i];
                            required = !filterRelations.some(
                                el => el === relation
                            );
                            if (!required) {
                                break;
                            }
                        }
                        return required;
                    });
                 
                    response.status(status).send(data);
                })
                .catch(({ status, data }) => {
                    response.status(status).send(data);
                });
        }
    );


}
