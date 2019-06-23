declare type Visitor<K, V> = (value: V, key: K, map: Multimap<K, V>) => void;

export declare class Multimap<K = string, V = any> {
    constructor();

    set(key: K, value: V): void;
    get(key: K): Array<V> | void;
    has(key: K): boolean;
    forEach(visitor: Visitor<K, V>): void;
    clear(): void;
    keys(): Iterable<K>;
    delete(key: K, value?: V): void;
}

export default Multimap;
