#!/usr/bin/env python3
"""Offline, resumable editorial harness. Never writes to Firebase or publishes."""
import argparse
from collections import Counter
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'question-bank'
ALIASES = {'fabric-data-engineer-associate': 'dp-700', 'azure-fundamentals': 'az-900',
           'aws-cloud-practitioner': 'aws-clf-c02', 'aws-solutions-architect-associate': 'aws-saa-c03'}
HOSTS = {'Microsoft': ['learn.microsoft.com', 'aka.ms', 'arch-center.azureedge.net'],
         'GitHub': ['docs.github.com', 'resources.github.com', 'learn.microsoft.com', 'assets.ctfassets.net'],
         'AWS': ['aws.amazon.com', 'docs.aws.amazon.com', 'd1.awsstatic.com'],
         'Google Cloud': ['cloud.google.com', 'services.google.com', 'docs.cloud.google.com'],
         'Databricks': ['databricks.com', 'www.databricks.com', 'docs.databricks.com']}

def read(path):
    return json.loads(Path(path).read_text())

def write(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')
    temp.replace(path)

def allowed(url, provider):
    if not isinstance(url, str): return False
    parsed = urlparse(url)
    return parsed.scheme == 'https' and parsed.hostname in HOSTS[provider] and not parsed.username and not parsed.password

def weight(title):
    m = re.search(r'(\d+(?:\.\d+)?)\s*(?:[–−-]\s*(\d+(?:\.\d+)?))?\s*%', title)
    return (float(m[1]) + float(m[2])) / 2 if m and m[2] else float(m[1]) if m else None

def quotas(domains, target):
    weights = [weight(d['title']) for d in domains]
    weighted = all(w is not None for w in weights)
    weights = weights if weighted else [1] * len(domains)
    if not weights: return [], 'blocked-no-domains'
    exact = [target * w / sum(weights) for w in weights]
    counts = [int(n) for n in exact]
    for i in sorted(range(len(counts)), key=lambda i: (-(exact[i] - counts[i]), i))[:target - sum(counts)]: counts[i] += 1
    return counts, 'normalized-official-weight-midpoints' if weighted else 'equal-editorial-allocation-not-official-weight'

def manifest(target=200):
    catalog = read(ROOT / 'data/certifications.json')['certifications']
    guides = read(ROOT / 'data/exam-guides.json')
    items = []
    for cert in catalog:
        guide = guides.get(cert['id'], {})
        counts, method = quotas(guide.get('domains', []), target)
        items.append({'id': cert['id'], 'bankId': ALIASES.get(cert['id'], cert['id']), 'name': cert['name'],
                      'provider': cert['provider'], 'target': target, 'sourceUrl': cert['official_url'],
                      'guideUrl': guide.get('guideUrl', cert['official_url']),
                      'inheritedGuideCheckedOn': guide.get('checkedOn'),
                      'researchStatus': 'needs-current-outline-review', 'allocationMethod': method,
                      'sections': [dict(d, target=n) for d,n in zip(guide.get('domains', []), counts)]})
    return {'schemaVersion': 1, 'targetTotal': target * len(items),
            'note': 'Planning inventory, not available questions. Inherited source dates are not fresh verification.',
            'certifications': items}

def tokens(text):
    return set(re.findall(r'[a-z0-9]+', text.lower()))

def fingerprint(text):
    return re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()

def validate(rows, plan, existing=None):
    certs = {c['id']:c for c in plan['certifications']}
    certs.update({c['bankId']:c for c in plan['certifications']})
    errors, warnings, approved = [], [], []
    seen_ids, seen_text, previous = set(), set(), []
    for q in existing or []:
        if isinstance(q, dict) and isinstance(q.get('question'), str):
            seen_text.add(fingerprint(q['question'])); previous.append((q.get('id', 'existing'), tokens(q['question'])))
    for i, row in enumerate(rows):
        prefix = f'Row {i+1}'
        fail = []
        if not isinstance(row, dict): errors.append(prefix + ': expected object'); continue
        q = row.get('question', {})
        if not isinstance(q, dict): errors.append(prefix + ': expected question object'); continue
        cert = certs.get(q.get('certification')) if isinstance(q.get('certification'), str) else None
        ident = row.get('id')
        if not isinstance(ident, str) or not re.fullmatch(r'[a-z0-9-]{1,120}', ident): fail.append('stable id missing/invalid')
        elif ident in seen_ids: fail.append('duplicate id')
        seen_ids.add(str(ident))
        if not cert: fail.append('unknown certification')
        elif not isinstance(q.get('sectionId'), str) or q.get('sectionId') not in {d['id'] for d in cert['sections']}: fail.append('unknown sectionId')
        for field,minimum in [('question',40), ('explanation',80), ('topic',3)]:
            if not isinstance(q.get(field), str) or not minimum <= len(q[field].strip()) <= 20000: fail.append(field + ' missing or too short/long')
        if q.get('difficulty') not in ['Easy','Medium','Hard']: fail.append('invalid difficulty')
        options = q.get('options', [])
        if not isinstance(options, list) or not 3 <= len(options) <= 6 or not all(isinstance(v,str) and 1 <= len(v.strip()) <= 20000 for v in options):
            fail.append('requires 3–6 substantive options'); options = []
        if len({fingerprint(o) for o in options}) != len(options): fail.append('duplicate options')
        answer = q.get('correctAnswer'); kind = q.get('questionType')
        valid_index = lambda a: type(a) is int and 0 <= a < len(options)
        if kind == 'single': valid = valid_index(answer)
        elif kind == 'multiple': valid = isinstance(answer,list) and 1 < len(answer) < len(options) and all(valid_index(a) for a in answer) and len(set(answer)) == len(answer)
        else: valid = False
        if not valid: fail.append('answer/type mismatch (harness supports single/multiple)')
        rationale = row.get('optionRationales', [])
        if not isinstance(rationale,list) or len(rationale) != len(options) or not all(isinstance(v,str) and len(v.strip()) >= 20 for v in rationale): fail.append('explain every option')
        if q.get('status') != 'draft' or q.get('isActive') is not False: fail.append('must remain inactive draft')
        if type(q.get('isAiGenerated')) is not bool: fail.append('declare AI provenance')
        if row.get('originality') != 'original-practice': fail.append('original-practice declaration required')
        refs = row.get('references', [])
        if not isinstance(refs,list) or not refs: fail.append('official evidence required'); refs=[]
        for ref in refs:
            if not isinstance(ref,dict): fail.append('invalid reference'); continue
            if cert and not allowed(ref.get('url',''),cert['provider']): fail.append('source must be provider HTTPS allowlist')
            if not isinstance(ref.get('supports'),str) or len(ref.get('supports','')) < 30: fail.append('source must identify supported fact')
            try: date.fromisoformat(ref.get('checkedOn',''))
            except (ValueError, TypeError): fail.append('source check date missing')
        if q.get('sourceUrl') not in [r.get('url') for r in refs if isinstance(r,dict)]: fail.append('sourceUrl absent from evidence')
        question_text = q.get('question') if isinstance(q.get('question'),str) else ''
        stem = fingerprint(question_text)
        if stem in seen_text: fail.append('duplicate stem, including across certifications')
        seen_text.add(stem)
        words = tokens(question_text)
        for old_id, old_words in previous:
            if words and len(words & old_words) / len(words | old_words) >= .8:
                fail.append(f'near-duplicate with {old_id}; independently review/rewrite'); break
        previous.append((ident, words))
        review = row.get('review', {})
        if not isinstance(review,dict): review = {}
        ready = review.get('status') == 'approved' and all(review.get(k) is True for k in ['answerVerified','topicVerified','originalityVerified']) and bool(review.get('reviewer'))
        if review.get('status') == 'approved' and not ready: fail.append('approval missing reviewer/checks')
        if fail: errors.append(prefix + ': ' + '; '.join(fail))
        elif ready: approved.append(row)
        else: warnings.append(prefix + ': pending independent editorial review; excluded from export')
    return {'errors': errors, 'warnings': warnings, 'approvedCount': len(approved), 'rowCount':len(rows)}, approved

def progress(plan, approved):
    counts = Counter((r['question']['certification'],r['question']['sectionId']) for r in approved)
    result=[]
    for c in plan['certifications']:
        sections=[]
        for d in c['sections']:
            n=counts[(c['bankId'],d['id'])] + (counts[(c['id'],d['id'])] if c['id'] != c['bankId'] else 0)
            sections.append(dict(d, approvedDrafts=n, remaining=max(0,d['target']-n)))
        result.append({'id':c['id'], 'target':c['target'], 'sections':sections, 'remaining':sum(d['remaining'] for d in sections)})
    return {'note':'Only reviewed local drafts; deployed Firebase coverage is unknown without an authorized export.', 'certifications':result}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=['plan','validate','next','export'])
    p.add_argument('--drafts', type=Path, default=DATA/'drafts.json')
    p.add_argument('--existing', type=Path, help='Optional question array exported from the deployed bank; used for duplicate checks')
    p.add_argument('--out', type=Path, default=DATA/'exports')
    args=p.parse_args(); plan=manifest()
    if args.command=='plan': write(DATA/'manifest.json',plan); print(f"Planned {len(plan['certifications'])} certifications / {plan['targetTotal']} original questions."); return
    rows=read(args.drafts); existing=read(args.existing) if args.existing else []
    if not isinstance(rows,list) or not isinstance(existing,list): p.error('drafts/existing must be JSON arrays')
    report,approved=validate(rows,plan,existing)
    write(DATA/'validation.json',report); coverage=progress(plan,approved); write(DATA/'coverage.json',coverage)
    if args.command=='next':
        for c in coverage['certifications']:
            for d in c['sections']:
                if d['remaining']: print(json.dumps({'certification':c['id'],'section':d,'instruction':'Check current official outline, research facts, author original scenarios, validate, independently review; never copy exam dumps.'},ensure_ascii=False)); return
    elif args.command=='export' and not report['errors']:
        # Fresh content-addressed output prevents mixing old batches into a new import.
        digest=hashlib.sha256(json.dumps(approved,sort_keys=True).encode()).hexdigest()[:12]
        dest=args.out/digest
        for c in plan['certifications']:
            questions=[]
            for row in approved:
                q=row['question']
                if q['certification'] not in [c['id'],c['bankId']]: continue
                questions.append(dict(q, certification=c['bankId'], explanation=q['explanation']+'\n\n'+'\n'.join(f'{i+1}. {r}' for i,r in enumerate(row['optionRationales'])), status='draft',isActive=False))
            for offset in range(0,len(questions),200): write(dest/f"{c['id']}-{offset//200+1}.json",questions[offset:offset+200])
        write(dest/'review-ledger.json',approved)
        print(f'Exported {len(approved)} reviewed inactive drafts to {dest}; no database writes.')
    print(json.dumps(report,indent=2))
    if report['errors']: sys.exit(1)

if __name__=='__main__': main()
