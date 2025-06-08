import { z } from 'zod';
import { notificationDetailsSchema } from "./notifications.js";
export const eventFrameAddedSchema = z.object({
    event: z.literal('frame_added'),
    notificationDetails: notificationDetailsSchema.optional(),
});
export const eventFrameRemovedSchema = z.object({
    event: z.literal('frame_removed'),
});
export const eventNotificationsEnabledSchema = z.object({
    event: z.literal('notifications_enabled'),
    notificationDetails: notificationDetailsSchema.required(),
});
export const notificationsDisabledSchema = z.object({
    event: z.literal('notifications_disabled'),
});
export const serverEventSchema = z.discriminatedUnion('event', [
    eventFrameAddedSchema,
    eventFrameRemovedSchema,
    eventNotificationsEnabledSchema,
    notificationsDisabledSchema,
]);
