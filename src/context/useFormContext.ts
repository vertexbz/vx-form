import { FORM_LISTENER } from '../constant';
import FormModel from '../model';
import { FormModelListenerSig } from '../type';
import { useContext } from './context';
import { FormHelperType } from './make';

type FormContextType = {
    model: FormModel,
    useModelEffect: (listener: FormModelListenerSig) => void,
    helper: FormHelperType
};

export default (): FormContextType => {
    const context = useContext();

    return {
        useModelEffect: (listener) => context.helper.useModelEffect(FORM_LISTENER, listener),
        model: context.model,
        helper: context.helper.form
    };
};

