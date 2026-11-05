"use client"
import {SoftBlurText} from './soft-blur-text'
export function ScrollHeading({text,as='h2',gradient=false,loop=false}:{text:string;as?:'h1'|'h2'|'span';gradient?:boolean;loop?:boolean}){
 return <SoftBlurText text={text} as={as} gradient={gradient} loop={loop}/>
}
