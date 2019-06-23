import { useState } from 'react';
import { useFieldContext } from '../context';

export default (field: string | number) => {
    const { helper, model, useModelEffect, path } = useFieldContext(field);

    const [value, setValue] = useState(() => model.getValue(path));

    useModelEffect(path, ({ value }) => {
        setValue(value);
    }, []);

    return {
        value,
        onFocus: () => helper.focus(path),
        onChange: (value: any) => helper.change(path, value),
        onBlur: () => helper.blur(path)
    };
};
