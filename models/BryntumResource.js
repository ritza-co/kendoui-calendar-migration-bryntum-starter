import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BryntumResource = sequelize.define(
    'BryntumResource',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : false
        },
        eventColor : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        readOnly : {
            type         : DataTypes.BOOLEAN,
            defaultValue : false
        }
    },
    {
        tableName  : 'bryntum_resources',
        timestamps : false
    }
);

export default BryntumResource;
