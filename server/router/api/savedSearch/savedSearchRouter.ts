import { Request, Response, Router } from 'express';
import { savedSearchServer } from './savedSearch';

export function savedSearchRouter(router: Router) {
    router.get(
        '/api/saved_search',
        async (request: Request, response: Response) => {
            savedSearchServer
                .getSavedSearch()
                .then(res => {
                    response.status(res.status).send(res.data);
                })
                .catch(({ status, data }) => {
                    response.status(status).send(data);
                });
        }
    );
}
