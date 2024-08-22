import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { KendoUITask, KendoUIResource } from './models/index.js';

async function setupDatabase() {
  // Wait for all models to synchronize with the database
  await sequelize.sync();

  // Now add example data
  await addExampleData();
}

async function addExampleData() {
  try {
    // Read and parse the JSON data
    const resourcesData = JSON.parse(
      readFileSync('./initialData/kendoUIResources.json')
    );
    const tasksData = JSON.parse(
      readFileSync('./initialData/KendoUITasks.json')
    );

    await sequelize.transaction(async (t) => {
      const resources = await KendoUIResource.bulkCreate(resourcesData, {
        transaction: t,
      });
      const tasks = await KendoUITask.bulkCreate(tasksData, { transaction: t });
      return { resources, tasks };
    });

    console.log('resources and tasks added to database successfully.');
  } catch (error) {
    console.error('Failed to add data to database due to an error: ', error);
  }
}

setupDatabase();
