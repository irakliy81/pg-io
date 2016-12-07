export function since(start: number[]) {
    const diff = process.hrtime(start);
    return diff[0] * 1000 + Math.floor(diff[1] / 100000) / 10;
}

export interface Logger {
    debug(message: string, source?: string);
    info(message: string, source?: string);
    warn(message: string, source?: string);

    error(error: Error);

    log(event: string, properties?: { [key: string]: any });
    track(metric: string, value: number);
    trace(source: string, command: string, time: number, success?: boolean);
}