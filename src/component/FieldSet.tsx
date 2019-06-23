import * as React from 'react';
import { ReactNode, ComponentProps, ElementType } from 'react';
import { path } from 'vx-std';
import { useContext, Provider } from '../context';

type FieldSetProps<C extends ElementType> = ComponentProps<C> & {
    name: string | number,
    children?: ReactNode | Array<ReactNode>,
    render?: boolean,
    component?: C
};

export default function FieldSet<C extends ElementType>({
    name,
    children,
    render,
    component: Component = 'fieldset',
    ...props
}: FieldSetProps<C>) {
    const context = useContext();

    return (
        <Provider value={{ ...context, name: path.concat(context.name, path.stringifyItem(name)) }}>
            {render ? (
                <Component {...props}>
                    {children}
                </Component>
            ) : children}
        </Provider>
    );
};
