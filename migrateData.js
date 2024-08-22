import sequelize from './config/database.js';
import {
  KendoUIResource,
  KendoUITask,
  BryntumResource,
  BryntumEvent,
} from './models/index.js';

async function setupDatabase() {
  // Wait for all models to synchronize with the database
  await sequelize.sync();

  // Now add example data
  await migrateExampleData();
}

async function migrateExampleData() {
  try {
    // Read the existing data
    const kendoUIResourcesDataPromise = await KendoUIResource.findAll();
    const KendoUITasksDataPromise = await KendoUITask.findAll();

    const [kendoUIResourcesData, KendoUITasksData] = await Promise.all([
      kendoUIResourcesDataPromise,
      KendoUITasksDataPromise,
    ]);

    // transform data to match existing Bryntum data structure
    const bryntumResourcesData = [];
    const bryntumEventsData = [];

    for (let resource of kendoUIResourcesData) {
      const bryntumResource = {};
      bryntumResource.id = resource.value;
      bryntumResource.name = resource.text;
      bryntumResource.eventColor = resource.color;
      bryntumResourcesData.push(bryntumResource);
    }

    for (let task of KendoUITasksData) {
      const bryntumEvent = {};

      bryntumEvent.id = task.id;
      bryntumEvent.name = task.title;
      bryntumEvent.resourceId = task.ownerId;
      bryntumEvent.timeZone = task.startTimezone;
      bryntumEvent.allDay = task.isAllDay;
      bryntumEvent.startDate = task.start;
      bryntumEvent.endDate = task.end;
      bryntumEvent.exceptionDates = task.recurrenceException;
      bryntumEvent.recurrenceRule = task.recurrenceRule;

      bryntumEventsData.push(bryntumEvent);
    }

    // add transformed data to Bryntum database tables
    await sequelize.transaction(async (t) => {
      const resources = await BryntumResource.bulkCreate(bryntumResourcesData, {
        transaction: t,
      });
      const events = await BryntumEvent.bulkCreate(bryntumEventsData, {
        transaction: t,
      });
      return { resources, events };
    });

    console.log('Resources and events migrated successfully.');
  } catch (error) {
    console.error('Failed to migrate data due to an error: ', error);
  }
}

setupDatabase();
