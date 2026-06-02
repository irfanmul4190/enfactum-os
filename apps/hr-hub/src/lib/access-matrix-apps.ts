// Re-export under the legacy local name. Canonical list lives in
// @enfactum/auth-gate to keep launcher's matrix UI and HR Hub's seeder in
// sync. Existing call sites (AddEmployee) keep working without import churn.
import { ACCESS_MATRIX_APPS, type AccessMatrixAppId } from "@enfactum/auth-gate";

export const ACCESS_MATRIX_APPS_LIST = ACCESS_MATRIX_APPS.map(a => a.id);
// Back-compat: AddEmployee imports the bare-id list as ACCESS_MATRIX_APPS.
export { ACCESS_MATRIX_APPS_LIST as ACCESS_MATRIX_APPS };
export type AccessMatrixApp = AccessMatrixAppId;
