import type {Question} from '@/lib/questions'
import {questionSection} from '@/lib/exam-guide'
export function freeQuestions(certification:string,questions:Question[]){const count=new Map<string,number>();return [...questions].sort((a,b)=>a.id.localeCompare(b.id)).filter(q=>{const section=questionSection(certification,q);const n=count.get(section)||0;count.set(section,n+1);return n<5})}
