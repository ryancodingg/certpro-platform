import {readFileSync,writeFileSync} from 'node:fs'
const guides=JSON.parse(readFileSync(new URL('../data/exam-guides.json',import.meta.url),'utf8'))
const previews=Object.fromEntries(Object.entries(guides).map(([id,guide])=>[id,{overview:guide.overview||'',domains:guide.domains||[]}]))
writeFileSync(new URL('../data/guide-previews.json',import.meta.url),JSON.stringify(previews)+'\n')
