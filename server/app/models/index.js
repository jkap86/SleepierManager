'use strict'
const dbConfig = require("./db.config");

const Sequelize = require("sequelize");

const ssl = process.env.DATABASE_URL ? { rejectUnauthorized: false } : false

const sequelize = new Sequelize(dbConfig.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: ssl, useUTC: false },
    logging: false,
    pool: {
        max: 30,
        min: 0,
        acquire: 10000,
        idle: 10000
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./user.model.js")(sequelize, Sequelize);
db.leagues = require("./league.model.js")(sequelize, Sequelize);

db.users.belongsToMany(db.leagues, { through: { model: 'userLeagues' } })
db.leagues.belongsToMany(db.users, { through: { model: 'userLeagues' } })


module.exports = db;