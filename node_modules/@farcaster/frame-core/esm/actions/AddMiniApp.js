import * as Errors from "../errors.js";
/**
 * Thrown when the frame does not have a valid domain manifest.
 */
export class InvalidDomainManifest extends Errors.BaseError {
    name = 'AddMiniApp.InvalidDomainManifest';
    constructor() {
        super('Invalid domain manifest');
    }
}
/**
 * Thrown when add frame action was rejected by the user.
 */
export class RejectedByUser extends Errors.BaseError {
    name = 'AddMiniApp.RejectedByUser';
    constructor() {
        super('Add frame rejected by user');
    }
}
