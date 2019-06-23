import { createContext, useContext as useReactContext } from 'react';
import { ContextType } from './make';

const reactContext = createContext<ContextType>(null as any);

export const Provider = reactContext.Provider;

export const Consumer = reactContext.Consumer;

export default reactContext;

export const useContext = (): ContextType => {
    const context = useReactContext(reactContext);
    if (!context) {
        throw new Error('Using fields outside form context is a big no-no here!');
    }

    return context;
};
