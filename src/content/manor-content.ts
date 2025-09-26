import type { TFunction } from "i18next";

export function getManorContent(t: TFunction) {
    return {
        usageContent: t("manorIntro.usageContent"),
        contractContent: t("manorIntro.contractContent"),
    };
}
