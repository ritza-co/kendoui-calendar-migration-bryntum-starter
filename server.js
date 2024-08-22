import express from 'express';
import path from 'path';
import {
  KendoUITask,
  KendoUIResource,
  BryntumEvent,
  BryntumResource,
} from './models/index.js';

global.__dirname = path.resolve();

const port = 1337;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(
  express.static(path.join(__dirname, '/node_modules/@bryntum/calendar'))
);
app.use(express.json());
// Middleware to parse application/x-www-form-urlencoded data
app.use(express.urlencoded({ extended: true }));

app.get('/api/tasks/get', async (req, res) => {
  try {
    const tasks = await KendoUITask.findAll();
    res.status(200).json(tasks);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'There was an error fetching the tasks' });
  }
});

app.post('/api/tasks/sync', async (req, res) => {
  const { created, updated, destroyed } = req.body;
  const returnData = { created: [], updated: [] };
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
            ownerId: parseInt(ownerId),
            isAllDay: isAllDay === 'true',
          },
          {
            where: {
              id: parseInt(id),
            },
          }
        );
        const newTask = await KendoUITask.findByPk(id);
        returnData.created.push(newTask);
      }
    }
    if (destroyed) {
      for (const task of destroyed) {
        await KendoUITask.destroy({
          where: {
            id: task.id,
          },
        });
      }
    }
    res.status(200).json(returnData);
  } catch (e) {
    console.error(e);
    res.status(500).json('There was an error syncing the task changes');
  }
});

app.get('/api/resources/get', async (req, res) => {
  try {
    const resources = await KendoUIResource.findAll();
    res.status(200).json(resources);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: 'There was an error fetching the resources' });
  }
});

app.get('/api/load', async (req, res) => {
  try {
    const resourcesPromise = BryntumResource.findAll();
    const eventsPromise = BryntumEvent.findAll();
    const [resources, events] = await Promise.all([
      resourcesPromise,
      eventsPromise,
    ]);

    res
      .send({
        resources: { rows: resources },
        events: { rows: events },
      })
      .status(200);
  } catch (error) {
    console.error({ error });
    res.send({
      success: false,
      message: 'There was an error loading the resources and events data.',
    });
  }
});

app.post('/api/sync', async function (req, res) {
  const { requestId, events, resources } = req.body;

  try {
    const response = { requestId, success: true };

    if (resources) {
      const rows = await applyTableChanges('resources', resources);
      // if new data to update client
      if (rows) {
        response.resources = { rows };
      }
    }

    if (events) {
      const rows = await applyTableChanges('events', events);
      if (rows) {
        response.events = { rows };
      }
    }

    res.send(response);
  } catch (error) {
    console.error({ error });
    res.send({
      requestId,
      success: false,
      message: 'There was an error syncing the data changes.',
    });
  }
});

async function applyTableChanges(table, changes) {
  let rows;
  if (changes.added) {
    rows = await createOperation(changes.added, table);
  }
  if (changes.updated) {
    await updateOperation(changes.updated, table);
  }
  if (changes.removed) {
    await deleteOperation(changes.removed, table);
  }
  // if got some new data to update client
  return rows;
}

function createOperation(added, table) {
  return Promise.all(
    added.map(async (record) => {
      const { $PhantomId, ...data } = record;
      let id;
      if (table === 'events') {
        let { exceptionDates, ...eventData } = data;
        // if exceptionDates is an array, convert it to a comma separated string
        if (Array.isArray(exceptionDates)) {
          exceptionDates = exceptionDates.join(',');
        }
        const event = await BryntumEvent.create({
          ...eventData,
          exceptionDates,
        });
        id = event.id;
      }
      if (table === 'resources') {
        const resource = await BryntumResource.create({
          ...data,
        });
        id = resource.id;
      }
      // report to the client that we changed the record identifier
      return { $PhantomId, id };
    })
  );
}

function deleteOperation(deleted, table) {
  return Promise.all(
    deleted.map(async ({ id }) => {
      if (table === 'events') {
        await BryntumEvent.destroy({
          where: {
            id: id,
          },
        });
      }
      if (table === 'resources') {
        await BryntumResource.destroy({
          where: {
            id: id,
          },
        });
      }
    })
  );
}

function updateOperation(updated, table) {
  return Promise.all(
    updated.map(async ({ id, ...data }) => {
      if (table === 'events') {
        let { exceptionDates, ...eventData } = data;
        // if exceptionDates is an array, convert it to a comma separated string
        if (Array.isArray(exceptionDates)) {
          exceptionDates = exceptionDates.join(',');
        }
        await BryntumEvent.update(
          { ...eventData, exceptionDates },
          { where: { id } }
        );
      }
      if (table === 'resources') {
        await BryntumResource.update(data, { where: { id } });
      }
    })
  );
}

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
