import { MagicMap } from 'vx-std';
import { ValidationResultType, ValidatorSig, AsyncValidatorSig } from '../../type';

type ValidationCacheVisitorSig = (field: string, validator: ValidatorSig | AsyncValidatorSig, result: ValidationResultType) => void;

export default
class ValidationCache {
    //_store.get(validator).get(field)
    _store = new MagicMap<ValidatorSig | AsyncValidatorSig, Map<string, ValidationResultType>>(() => new Map());

    set(field: string, validator: ValidatorSig | AsyncValidatorSig, result: ValidationResultType | void | null) {
        if (result) {
            this._store.get(validator).set(field, result);
        } else {
            this.delete(field, validator);
        }
    }

    has(field: string, validator: ValidatorSig | AsyncValidatorSig): boolean {
        if (this._store.has(validator)) {
            return this._store.get(validator).has(field);
        }

        return false;
    }

    get(field: string, validator: ValidatorSig | AsyncValidatorSig): ValidationResultType | void | null {
        return this._store.get(validator).get(field);
    }

    delete(field: string, validator: ValidatorSig | AsyncValidatorSig): void {
        if (this._store.has(validator)) {
            this._store.get(validator).delete(field);
        }
    }

    forEach(visitor: ValidationCacheVisitorSig) {
        this._store.forEach((fields, validator) => {
            fields.forEach((result, field) => {
                visitor(field, validator, result);
            });
        });
    }
}
