import type { StudyModule } from "../module-types";
import { mathTrigModule } from "../math06";
import { staticsForceSystemsModule } from "./statics-force-systems";
import { staticsRemainingModules } from "./statics-remaining";
import { dynamicsModules } from "./dynamics";
import { thermodynamicsModules } from "./thermodynamics";
import { mechanicsMaterialsModules } from "./mechanics-materials";
import { fluidMechanicsModules } from "./fluid-mechanics";
import { measurementsControlsModules } from "./measurements-controls";
import { mathRemainingModules } from "./math-remaining";
import { probabilityStatisticsModules } from "./probability-statistics";
import { electricityMagnetismModules } from "./electricity-magnetism";
import { ethicsModules } from "./ethics";
import { heatTransferModules } from "./heat-transfer";
import { materialsModules } from "./materials";
import { engineeringEconomicsModules } from "./engineering-economics";
import { mechanicalDesignModules } from "./mechanical-design";

// Registry key is `${subjectId}:${sectionId}` (both from subjects.ts). A subject/section
// with no entry here renders as a locked "content pipeline ready" placeholder in the app.
const allModules: StudyModule[] = [
  mathTrigModule,
  ...mathRemainingModules,
  ...probabilityStatisticsModules,
  ...ethicsModules,
  ...engineeringEconomicsModules,
  staticsForceSystemsModule,
  ...staticsRemainingModules,
  ...dynamicsModules,
  ...thermodynamicsModules,
  ...mechanicsMaterialsModules,
  ...fluidMechanicsModules,
  ...measurementsControlsModules,
  ...electricityMagnetismModules,
  ...heatTransferModules,
  ...materialsModules,
  ...mechanicalDesignModules,
];

export const moduleRegistry: Record<string, StudyModule> = Object.fromEntries(
  allModules.map((m) => [`${m.subjectId}:${m.sectionId}`, m])
);
