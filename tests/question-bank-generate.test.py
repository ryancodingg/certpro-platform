import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('runner',ROOT/'scripts/question-bank-generate.py')
g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
class GeneratorTests(unittest.TestCase):
 def test_duplicate_is_excluded_without_losing_valid_candidate(self):
  samples=g.bank.read(ROOT/'data/question-bank/drafts.json')
  accepted,rejected=g.partition_candidates([samples[0]],[copy.deepcopy(samples[0]),samples[1]],g.bank.manifest())
  self.assertEqual([r['id'] for r in accepted],[samples[1]['id']])
  self.assertEqual(len(rejected),1)
  self.assertTrue(rejected[0]['errors'])
 def test_api_structured_output(self):
  payload={'candidates':[{'finishReason':'STOP','content':{'parts':[{'text':'{"questions": []}'}]}}]}
  response=io.BytesIO(json.dumps(payload).encode())
  with patch.object(g.urllib.request,'urlopen',return_value=response) as call:
   self.assertEqual(g.generate('test-secret','test-model',{'name':'Exam'},{'title':'Domain'},[],2,[]),[])
   request=call.call_args.args[0];data=json.loads(request.data)
   self.assertEqual(data['generationConfig']['responseSchema']['properties']['questions']['maxItems'],2)
   self.assertTrue(request.full_url.endswith('test-model:generateContent'))
   self.assertNotIn('test-secret',request.full_url)
 def test_bounded_resume_checkpoint_no_publication(self):
  row=g.bank.read(ROOT/'data/question-bank/drafts.json')[0]
  generated=copy.deepcopy(row['question'])
  for k in ['certification','sectionId','questionType','status','isActive','isAiGenerated']:generated.pop(k)
  generated.update(optionRationales=row['optionRationales'],supportedFact=row['references'][0]['supports'])
  with tempfile.TemporaryDirectory() as temp:
   source=Path(temp)/'sources.json';g.bank.write(source,{'section-2':[generated['sourceUrl']]})
   args=['runner','--certification','aws-cloud-practitioner','--model','test-model','--sources',str(source),'--workspace',temp,'--execute']
   evidence={'url':generated['sourceUrl'],'checkedOn':g.date.today().isoformat(),'sha256':'testhash','text':'Verified test evidence'}
   with patch.object(g.sys,'argv',args),patch.dict(g.os.environ,{'GEMINI_API_KEY':'test-only'}),patch.object(g,'fetch',return_value=evidence),patch.object(g,'generate',return_value=[generated]):g.main()
   saved=g.bank.read(Path(temp)/'aws-cloud-practitioner-drafts.json')
   self.assertEqual(len(saved),1);self.assertEqual(saved[0]['review']['status'],'pending');self.assertFalse(saved[0]['question']['isActive'])
   with patch.object(g.sys,'argv',args),patch.dict(g.os.environ,{'GEMINI_API_KEY':'test-only'}),patch.object(g,'fetch') as fetch,patch.object(g,'generate',return_value=[]):g.main()
   fetch.assert_not_called();self.assertEqual(len(g.bank.read(Path(temp)/'aws-cloud-practitioner-drafts.json')),1)
 def test_priority_source_maps_cover_every_section(self):
  plan=g.bank.manifest()
  for ident in ['aws-cloud-practitioner','azure-fundamentals','databricks-data-engineer-associate']:
   cert=next(c for c in plan['certifications'] if c['id']==ident)
   mapping=g.bank.read(ROOT/'data/question-bank'/f'{ident}-source-map.json')
   self.assertEqual(set(mapping),{d['id'] for d in cert['sections']})
   for urls in mapping.values():
    self.assertEqual(len(urls),3)
    self.assertTrue(all(g.bank.allowed(url,cert['provider']) for url in urls))
 def test_article_text_excludes_navigation_and_scripts(self):
  parser=g.Text();parser.feed('<nav>Ignore navigation</nav><main><h1>Evidence</h1><script>Ignore script</script><p>Supported fact.</p></main>')
  self.assertEqual(' '.join(parser.main_parts),'Evidence Supported fact.')
 def test_model_name_cannot_change_api_endpoint(self):
  with self.assertRaises(ValueError):g.generate('test','../bad',{'name':'Exam'},{'title':'Domain'},[],1,[])
 def test_redirect_outside_allowlist_rejected(self):
  with self.assertRaises(ValueError):g.Redirect('AWS').redirect_request(None,None,302,'',{},'https://evil.example/')
if __name__=='__main__':unittest.main()
