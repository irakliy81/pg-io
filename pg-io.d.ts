declare module "pg-io" {

    // GLOBAL
    // --------------------------------------------------------------------------------------------
    export interface ConnectionSettings {
        host        : string;
        port?       : number;
        user        : string;
        password    : string;
        database    : string;
        poolSize?   : number;
    }

    export interface Configuration {
        connectionConstructor: typeof Connection;
        logger: Logger;
    }
    
    export interface Utilities {
        since(start: number[]): number;
    }

    export function db(settings: ConnectionSettings): Database;
    export const defaults: ConnectionOptions;
    export const config: Configuration;
    export const utils: Utilities;

    // DATABASE
    // --------------------------------------------------------------------------------------------
    export interface ConnectionOptions {
        collapseQueries?    : boolean;
        startTransaction?   : boolean;
    }

    export interface PoolState {
        size        : number;
        available   : number;
    }

    export interface Database {
        connect(options?: ConnectionOptions): Promise<Connection>;
        getPoolState(): PoolState;
    }

    // CONNECTION
    // --------------------------------------------------------------------------------------------
    export class Connection {
        isActive        : boolean;
        inTransaction   : boolean;
        
        startTransaction(lazy?: boolean)    : Promise<void>;
        
        release(action: 'commit')           : Promise<void>;
        release(action: 'rollback')         : Promise<void>;
        release(action?: string)            : Promise<any>;

        execute<T>(query: ResultQuery<T>)   : Promise<any>;
        execute(query: Query)               : Promise<void>;
        execute(queries: Query[])           : Promise<Map<string,any>>;
        
        constructor(database: Database, options: ConnectionOptions);
        
        protected state: ConnectionState;
        protected options: ConnectionOptions;
        protected database: Database;
        protected processQueryResult(query: Query, result: DbQueryResult): any[];
        protected rollbackAndRelease(reason?: any): Promise<any>;
        protected releaseConnection(error?: any);
        protected log(message: string);
    }

    // RESULT HANDLER
    // --------------------------------------------------------------------------------------------
    export interface ResultHandler<T> {
        parse(row: any): T;
    }

    // QUERY
    // --------------------------------------------------------------------------------------------
    export interface Query {
        text    : string;
        name?   : string;
        params? : any;
    }
    
    export interface ResultQuery<T> extends Query {
        mask    : string;
        handler?: ResultHandler<T>;
    }
    
    export interface OneResultQuery<T> extends ResultQuery<T> {
        mask    : 'object';
    }

    export interface ListResultQuery<T> extends ResultQuery<T> {
        mask    : 'list';
    }
    
    // SUPPORTING ENUMS AND INTERFACES
    // --------------------------------------------------------------------------------------------
    const enum ConnectionState {
        connection = 1,
        transaction,
        transactionPending,
        released
    }
    
    interface DbQueryResult {
        rows: any[];
    }
    
    // ERROR CLASSES
    // --------------------------------------------------------------------------------------------
    export class PgError extends Error {
        cause: Error;
        
        constructor(cause: Error);
	    constructor(message: string, cause?: Error);
    }
	
    export class ConnectionError extends PgError {}
    export class TransactionError extends PgError {}
    export class QueryError extends PgError {}
    export class ParseError extends PgError {}

    // LOGGER
    // --------------------------------------------------------------------------------------------
    export interface Logger {
        debug(message: string);
        info(message: string);
        warn(message: string);

        error(error: Error);

        log(event: string, properties?: { [key: string]: any });
        track(metric: string, value: number);
        trace(service: string, command: string, time: number, success?: boolean);
    }
}