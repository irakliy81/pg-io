"use strict";
// IMPORTS
// ================================================================================================
const events = require('events');
const pg = require('pg');
const errors_1 = require('./errors');
const defaults_1 = require('./defaults');
const util_1 = require('./util');
// MODULE VARIABLES
// ================================================================================================
const ERROR_EVENT = 'error';
// DATABASE CLASS
// ================================================================================================
class Database extends events.EventEmitter {
    constructor(options, logger, SessionCtr) {
        super();
        if (!options)
            throw TypeError('Cannot create a Database: options are undefined');
        if (!options.connection)
            throw TypeError('Cannot create a Database: connection settings are undefined');
        // set basic properties
        this.name = options.name || defaults_1.defaults.name;
        this.Session = SessionCtr || defaults_1.defaults.SessionCtr;
        this.sOptions = Object.assign({}, options.session, defaults_1.defaults.session);
        this.logger = logger;
        // initialize connection pool
        const connectionSettings = Object.assign({}, defaults_1.defaults.connection, options.connection);
        const poolOptions = Object.assign({}, defaults_1.defaults.pool, options.pool);
        this.pgPool = new pg.Pool(buildPgPoolOptions(connectionSettings, poolOptions));
        this.pgPool.on('error', (error) => {
            // turn off error emitter because pgPool emits duplicate errors when client creation fails
            // this.emit(ERROR_EVENT, error); 
        });
    }
    connect(options) {
        options = Object.assign({}, this.sOptions, options);
        const start = process.hrtime();
        this.logger && this.logger.debug(`Connecting to the database; pool state ${this.getPoolDescription()}`, this.name);
        return new Promise((resolve, reject) => {
            this.pgPool.connect((error, client) => {
                if (error)
                    return reject(new errors_1.ConnectionError(error));
                const session = new this.Session(this.name, client, options, this.logger);
                this.logger && this.logger.trace(this.name, 'connected', util_1.since(start), true);
                resolve(session);
            }).catch((error) => {
                this.logger && this.logger.trace(this.name, 'connected', util_1.since(start), false);
                // ignore rejected promise returned from pgPool.connect() because
                // the error is handled within the callback above
            });
        });
    }
    close() {
        return this.pgPool.end();
    }
    // POOL INFO ACCESSORS
    // --------------------------------------------------------------------------------------------
    getPoolState() {
        return {
            size: this.pgPool.pool.getPoolSize(),
            available: this.pgPool.pool.availableObjectsCount()
        };
    }
    getPoolDescription() {
        return `{ size: ${this.pgPool.pool.getPoolSize()}, available: ${this.pgPool.pool.availableObjectsCount()} }`;
    }
}
exports.Database = Database;
// HELPER FUNCTIONS
// ================================================================================================
function buildPgPoolOptions(conn, pool) {
    return {
        host: conn.host,
        port: conn.port,
        user: conn.user,
        password: conn.password,
        database: conn.database,
        max: pool.maxSize,
        idleTimeoutMillis: pool.idleTimeout,
        reapIntervalMillis: pool.reapInterval
    };
}
//# sourceMappingURL=Database.js.map