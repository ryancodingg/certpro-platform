import importlib.util
import unittest
from pathlib import Path
import copy
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('harness',ROOT/'scripts/question-bank.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
class HarnessTests(unittest.TestCase):
 def setUp(self):
  self.plan=h.manifest(); self.rows=h.read(ROOT/'data/question-bank/drafts.json')
 def approve(self,row):
  row['review']={'status':'approved','reviewer':'test-reviewer','answerVerified':True,'topicVerified':True,'originalityVerified':True}
 def test_all_catalog_targets_and_rounding(self):
  self.assertEqual(len(self.plan['certifications']),111)
  self.assertEqual(self.plan['targetTotal'],22200)
  for c in self.plan['certifications']: self.assertEqual(sum(d['target'] for d in c['sections']),200)
  c=next(c for c in self.plan['certifications'] if c['id']=='aws-cloud-practitioner')
  self.assertEqual([d['target'] for d in c['sections']],[48,60,68,24])
 def test_unreviewed_never_export_ready(self):
  report,ready=h.validate(self.rows,self.plan)
  self.assertEqual(report['errors'],[]); self.assertEqual(ready,[])
 def test_cross_cert_duplicate_rejected(self):
  rows=copy.deepcopy(self.rows); new=copy.deepcopy(rows[0]);new['id']='another-id';new['question']['certification']='az-900';rows.append(new)
  report,_=h.validate(rows,self.plan);self.assertIn('duplicate stem',' '.join(report['errors']))
 def test_wrong_topic_answer_source_and_active_rejected(self):
  for key,val in [('sectionId','invented-topic'),('correctAnswer',True),('status','published'),('isActive',True),('sourceUrl','https://example.com')]:
   rows=copy.deepcopy(self.rows);rows[0]['question'][key]=val
   report,_=h.validate(rows,self.plan);self.assertTrue(report['errors'],key)
 def test_missing_approval_checks_rejected(self):
  self.rows[0]['review']={'status':'approved','reviewer':'someone'}
  report,_=h.validate(self.rows,self.plan);self.assertTrue(report['errors'])
 def test_resume_counts_aliases_exactly_once(self):
  self.approve(self.rows[0]);report,ready=h.validate(self.rows,self.plan)
  self.assertFalse(report['errors'])
  c=next(c for c in h.progress(self.plan,ready)['certifications'] if c['id']=='aws-cloud-practitioner')
  self.assertEqual(c['remaining'],199);self.assertEqual(c['sections'][1]['approvedDrafts'],1)
 def test_source_host_no_suffix_spoof(self):
  self.assertTrue(h.allowed('https://docs.aws.amazon.com/x','AWS'))
  self.assertFalse(h.allowed('https://docs.aws.amazon.com.evil.test/x','AWS'))
  self.assertFalse(h.allowed('https://user@docs.aws.amazon.com/x','AWS'))
if __name__=='__main__':unittest.main()
