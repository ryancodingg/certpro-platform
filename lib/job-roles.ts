import roleData from "@/data/certification-job-roles.json"

/** Career-relevance tags, not a promise that a credential qualifies someone for a job. */
export const jobRoles = roleData.roles
export function certificationMatchesJob(certificationId: string, roleId: string) {
  if (roleId === "All") return true
  return jobRoles.find(role => role.id === roleId)?.certificationIds.includes(certificationId) ?? false
}
export function certificationJobLabels(certificationId: string) {
  return jobRoles.filter(role => role.certificationIds.includes(certificationId)).map(role => role.label)
}
