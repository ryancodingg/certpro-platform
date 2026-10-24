import editorial from '@/data/news-editorial.json'
import type {NewsRecord} from './catalog'
const canonical=(url:string)=>url.replace(/\/$/,'')
export const reviewedNews=editorial.articles
export function enrichNews(item:NewsRecord):NewsRecord {
 const review=reviewedNews.find(article=>canonical(article.source_url)===canonical(item.source_url))
 return review?{...item,title:review.title,published_on:review.published_on||item.published_on,summary:review.summary,article_paragraphs:review.paragraphs,article_reviewed_on:review.reviewed_on}:item
}
