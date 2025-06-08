"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeParseFrameEmbed = exports.frameEmbedNextSchema = exports.buttonSchema = exports.actionSchema = exports.actionViewTokenSchema = exports.actionLaunchFrameSchema = void 0;
const zod_1 = require("zod");
const shared_ts_1 = require("./shared.js");
exports.actionLaunchFrameSchema = zod_1.z.object({
    type: zod_1.z.literal('launch_frame'),
    name: shared_ts_1.frameNameSchema,
    url: shared_ts_1.secureUrlSchema.optional(),
    splashImageUrl: shared_ts_1.secureUrlSchema.optional(),
    splashBackgroundColor: shared_ts_1.hexColorSchema.optional(),
});
exports.actionViewTokenSchema = zod_1.z.object({
    type: zod_1.z.literal('view_token'),
    token: shared_ts_1.caip19TokenSchema,
});
exports.actionSchema = zod_1.z.discriminatedUnion('type', [
    exports.actionLaunchFrameSchema,
    exports.actionViewTokenSchema,
]);
exports.buttonSchema = zod_1.z.object({
    title: shared_ts_1.buttonTitleSchema,
    action: exports.actionSchema,
});
exports.frameEmbedNextSchema = zod_1.z.object({
    version: zod_1.z.literal('next'),
    imageUrl: shared_ts_1.secureUrlSchema,
    aspectRatio: shared_ts_1.aspectRatioSchema.optional(),
    button: exports.buttonSchema,
});
const safeParseFrameEmbed = (rawResponse) => exports.frameEmbedNextSchema.safeParse(rawResponse);
exports.safeParseFrameEmbed = safeParseFrameEmbed;
