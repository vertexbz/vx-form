import * as React from 'react';
import { ComponentProps, useEffect } from 'react';
import useField from '../hook/useField';

type HiddenFieldProps = ComponentProps<'input'> & {
    name: string | number,
    html?: boolean,
    orphaned?: boolean
};

export default function HiddenField({ name, value, html, orphaned, ...props }: HiddenFieldProps) {
    const { onFocus, onChange, onBlur, value: formValue } = useField(name);

    useEffect(() => {
        if (!orphaned) {
            onFocus();
            onChange(value);
            onBlur();
        }
    }, [name, value, orphaned]);

    if (html) {
        return <input {...props} name={name} style={{ display: 'none' }} defaultValue={formValue}/>;
    }

    return null;
}
