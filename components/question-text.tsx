/** Preserve the question wording; only add reading breaks to long prose. */
export function questionParagraphs(text:string):string[]{
 const blocks=text.replace(/\r\n/g,'\n').split(/\n\s*\n/).filter(Boolean)
 return blocks.flatMap(block=>{
  if(block.length<420||block.includes('\n'))return [block]
  const sentences=block.split(/(?<=[.!?])\s+(?=[A-Z])/)
  const paragraphs:string[]=[];let current=''
  for(const sentence of sentences){current+=(current?' ':'')+sentence;if(current.length>=260){paragraphs.push(current.trim());current=''}}
  if(current.trim())paragraphs.push(current.trim());return paragraphs
 })
}
export function QuestionText({text}:{text:string}){return <div className="cp-question-text">{questionParagraphs(text).map((part,i)=><p key={i}>{part}</p>)}</div>}
