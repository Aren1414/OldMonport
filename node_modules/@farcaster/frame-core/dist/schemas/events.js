"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverEventSchema = exports.notificationsDisabledSchema = exports.eventNotificationsEnabledSchema = exports.eventFrameRemovedSchema = exports.eventFrameAddedSchema = void 0;
const zod_1 = require("zod");
const notifications_ts_1 = require("./notifications.js");
exports.eventFrameAddedSchema = zod_1.z.object({
    event: zod_1.z.literal('frame_added'),
    notificationDetails: notifications_ts_1.notificationDetailsSchema.optional(),
});
exports.eventFrameRemovedSchema = zod_1.z.object({
    event: zod_1.z.literal('frame_removed'),
});
exports.eventNotificationsEnabledSchema = zod_1.z.object({
    event: zod_1.z.literal('notifications_enabled'),
    notificationDetails: notifications_ts_1.notificationDetailsSchema.required(),
});
exports.notificationsDisabledSchema = zod_1.z.object({
    event: zod_1.z.literal('notifications_disabled'),
});
exports.serverEventSchema = zod_1.z.discriminatedUnion('event', [
    exports.eventFrameAddedSchema,
    exports.eventFrameRemovedSchema,
    exports.eventNotificationsEnabledSchema,
    exports.notificationsDisabledSchema,
]);
