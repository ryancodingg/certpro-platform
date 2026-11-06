/** Ignore incidental spacing while keeping the user's input unchanged in the field. */
export function matchesDiscoverySearch(fields:readonly string[],query:string){
 return fields.join(' ').toLowerCase().includes(query.trim().toLowerCase())
}
