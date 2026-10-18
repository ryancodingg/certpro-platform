import raw from '@/data/exam-guides.json'
import { certificationById } from '@/lib/catalog'
type Domain={id:string;title:string}
export type Guide={sourceUrl:string;guideUrl:string;checkedOn:string;domains:Domain[];facts:{label:string;value:string}[];overview?:string;effectiveNote?:string}
export function guideFor(id:string):Guide{const c=certificationById(id);return (raw as Record<string,Guide>)[c?.id||id]||{sourceUrl:c?.official_url||'https://certpro.vercel.app/certifications',guideUrl:c?.official_url||'https://certpro.vercel.app/certifications',checkedOn:'2026-10-18',domains:[],facts:[]}}
const topics:Record<string,Record<string,number>>={
 'dp-700':{'Microsoft Fabric Networking':1,'Microsoft Fabric Governance':1,'Microsoft Fabric Security':1,'Microsoft Fabric Roles & Permissions':1,'Row-Level Security in Microsoft Fabric':1,'Implement and manage an analytics solution':1,'Microsoft Fabric Deployment':1,'Microsoft Fabric Warehouse Deployment':1,'Microsoft Fabric Deployment Pipelines':1,'Power BI Deployment':1,'Microsoft Fabric and Azure DevOps Integration':1,'Microsoft Fabric Data Ingestion':2,'Microsoft Fabric data ingestion and transformation':2,'Microsoft Fabric OneLake and Eventhouse':2,'Microsoft Fabric - KQL Queries':2,'Ingest and transform data':2,'Ingest and transform streaming data':2,'Microsoft Fabric Monitoring':3,'Microsoft Fabric Warehouse Monitoring':3,'Microsoft Fabric Performance Optimization':3,'Delta Lakehouse Maintenance':3,'Monitor and optimize an analytics solution':3},
 'az-900':{'Cloud responsibility':1,'Resource organization':2,'Availability':2,'Identity security':2,'Compute':2,'Storage':2,'Networking':2,'Hybrid networking':2,'Access management':2,'Cost organization':3,'Governance':3,'Resource protection':3,'Monitoring':3,'Service incidents':3,'Optimization':3,'Cost management':3},
 'aws-clf-c02':{'Shared responsibility':2,'Identity and access':2,'Global infrastructure':3,'Compute':3,'Elasticity':1,'Compute pricing':4,'Storage':3,'Databases':3,'Monitoring and audit':2,'Infrastructure as code':3,'Billing and cost':4},
 'databricks-data-engineer-associate':{'Medallion architecture':1,'File ingestion':2,'Batch ingestion':2,'Delta upserts':3,'Delta maintenance':6,'Delta retention':6,'Delta history':6,'Workflow orchestration':4,'Workflow recovery':6,'Unity Catalog permissions':7,'Data quality':3,'Deployment automation':5,'Credential handling':7,'SQL transformations':3,'SQL null handling':3}
}
export function questionSection(id:string,q:{id:string;topic:string;sectionId?:string}){
 const c=certificationById(id);const bank=c?.aliases[0]||c?.id||id;const domains=guideFor(id).domains
 if(q.sectionId&&domains.some(d=>d.id===q.sectionId))return q.sectionId
 const exact=domains.find(d=>d.title.toLowerCase().replace(/\s*\([^)]*%\)/g,'').trim()===q.topic.toLowerCase().trim());if(exact)return exact.id
 const n=topics[bank]?.[q.topic.trim()];if(n&&domains.some(d=>d.id===`section-${n}`))return `section-${n}`
 if(bank==='dp-700'&&q.id==='k8cFcsXBtQP9PmyEGohT')return 'section-2'
 if(bank==='dp-700'&&q.id==='uY94Y8lctIOLeZBxxHqZ')return 'section-3'
 return 'additional'
}
