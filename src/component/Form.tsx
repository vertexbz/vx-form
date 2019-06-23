import * as React from 'react';
import { ComponentProps, RefObject, useRef, useImperativeHandle } from 'react';
import { proxy } from 'vx-std';
import Provider, { ProviderRefType } from './Provider';

type FormProps = ComponentProps<'form'> & ComponentProps<typeof Provider>;

const Form = ({
    children,
    onSubmit,
    initialValues,
    includeInitial,
    onSubmitSuccess,
    onSubmitError,
    touchOn,
    syncValidateOn,
    asyncValidateOn,
    treatWarningsLikeErrors,
    ...props
}: FormProps, ref: RefObject<ProviderRefType & HTMLFormElement>) => {
    const provider = useRef<ProviderRefType | null>();
    const form = useRef<HTMLFormElement>();

    useImperativeHandle(ref, () => proxy.fallbackProxy(provider.current, form.current) as any, [provider.current, form.current]);

    return (
        <Provider
            ref={provider as RefObject<ProviderRefType>}
            initialValues={initialValues}
            includeInitial={includeInitial}
            onSubmit={onSubmit}
            onSubmitSuccess={onSubmitSuccess}
            onSubmitError={onSubmitError}
            touchOn={touchOn}
            syncValidateOn={syncValidateOn}
            asyncValidateOn={asyncValidateOn}
            treatWarningsLikeErrors={treatWarningsLikeErrors}
        >
            <form
                {...props}
                ref={form as RefObject<HTMLFormElement>}
                onSubmit={(e) => (e.preventDefault(), provider.current && provider.current.submit(), void 0)}
                onReset={(e) => (e.preventDefault(), provider.current && provider.current.reset(), void 0)}
            >
                {children}
            </form>
        </Provider>
    );
};

export default React.forwardRef<ProviderRefType & HTMLFormElement, FormProps>(Form as any);
