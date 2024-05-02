import { Router } from 'express';

import schedule from './schedule';
import { agenda } from '../../..';
import auth from '../../../middlewares/auth';

export function scheduleRouter(router: Router) {
    router.post('/api/schedule', auth, schedule);
    router.get('/api/schedule/:id', async (req, res) => {
        const jobs = await agenda.jobs({
            name: req.params.id
        });

        if (jobs.length) {
            res.send(jobs[0]);
        } else {
            res.send('Нет запланированных откликов');
        }
    });
    router.delete('/api/schedule/:id', async (req, res) => {
        const jobs = await agenda.jobs({
            name: req.params.id
        });
        if (jobs.length) {
            agenda.cancel({
                name: req.params.id
            });
            res.status(200).send('OK');
        } else {
            res.status(404).send('Задача не найдена');
        }
    });
}
