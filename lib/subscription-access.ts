export function hasPaidAccess(sub:any,old:any,amount:string,now=Date.now()){
 const last=sub.billing_info?.last_payment;const paidThrough=sub.billing_info?.next_billing_time||old.paidThrough
 const refunded=old.refundedAt&&(!last?.time||Date.parse(last.time)<=Date.parse(old.refundedAt))
 return !!(last?.amount?.currency_code==='USD'&&Number(last.amount.value)>=Number(amount)&&paidThrough&&Date.parse(paidThrough)>now&&!refunded&&['ACTIVE','CANCELLED'].includes(sub.status))
}
