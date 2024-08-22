import express from 'express';
import path from 'path';
import { KendoUITask, KendoUIResource } from './models/index.js';

global.__dirname = path.resolve();

const port = 1337;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
// Middleware to parse application/x-www-form-urlencoded data
app.use(express.urlencoded({ extended : true }));

app.get('/api/tasks/get', async(req, res) => {
    try {
        const tasks = await KendoUITask.findAll();
        res.status(200).json(tasks);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message : 'There was an error fetching the tasks' });
    }
});

app.post('/api/tasks/sync', async(req, res) => {
    const { created, updated, destroyed } = req.body;
    const returnData = { created : [], updated : [] };
    try {
        if (created) {
            for (const task of created) {
                const { id, ...data } = task;
                const newTask = await KendoUITask.create(data);
                returnData.created.push(newTask);
            }
        }
        if (updated) {
            for (const task of updated) {
                const { id, ownerId, isAllDay, ...data } = task;
                await KendoUITask.update(
                    {
                        ...data,
                        ownerId  : parseInt(ownerId),
                        isAllDay : isAllDay === 'true'
                    },
                    {
                        where : {
                            id : parseInt(id)
                        }
                    }
                );
                const newTask = await KendoUITask.findByPk(id);
                returnData.created.push(newTask);
            }
        }
        if (destroyed) {
            for (const task of destroyed) {
                await KendoUITask.destroy({
                    where : {
                        id : task.id
                    }
                });
            }
        }
        res.status(200).json(returnData);
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error syncing the task changes');
    }
});

app.get('/api/resources/get', async(req, res) => {
    try {
        const resources = await KendoUIResource.findAll();
        res.status(200).json(resources);
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ message : 'There was an error fetching the resources' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
