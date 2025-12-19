import log from 'electron-log';
import { QuestCache } from "~/lib/cache/QuestCache";
import type { JsonPacketHandler } from "../types";

const logger = log.scope('accept-quest');

export default {
    cmd: "acceptQuest",
    type: "json",
    run: (_bot, data) => {
        const questId = data.QuestID;

        if (data.bSuccess === 0) {
            logger.debug(`Failed to accept quest ${questId}`);
            return;
        }

        QuestCache.update(questId, { inProgress: true });
    },
} satisfies JsonPacketHandler<AcceptQuestData>;

type AcceptQuestData = {
    QuestID: number;
    bSuccess: number;
};