const test=require('node:test');
const assert=require('node:assert/strict');
const P=require('../dist/progress.js');
const ids=new Set(['devise','egalite']);
test('malformed or unknown lesson ids cannot enter saved progress',()=>{
  const x=P.clean({done:['devise','<script>',null,'devise'],best:999,resume:{route:'javascript:alert(1)',lessonId:'missing',step:99}},ids);
  assert.deepEqual(x.done,['devise']);assert.equal(x.best,100);assert.equal(x.resume.route,'parcours');assert.equal(x.resume.lessonId,null);
});
test('offline completions on two devices both survive merge',()=>{
  const x=P.merge({done:['devise'],best:40},{done:['egalite'],best:70},ids);
  assert.deepEqual(new Set(x.done),ids);assert.equal(x.best,70);
});
test('a later removal survives an older device syncing again',()=>{
  const old=P.changed({}, {known:['devise'],review:['egalite']},ids,100);
  const recent=P.changed(old,{...old,known:[],review:[]},ids,200);
  const merged=P.merge(recent,old,ids);
  assert.deepEqual(merged.known,[]);assert.deepEqual(merged.review,[]);
});
test('newest preference and lesson position are retained',()=>{
  const newer=P.changed({}, {english:false,resume:{route:'theme-valeurs',lessonId:'devise',step:2}},ids,200);
  const older=P.changed({}, {resume:{route:'parcours',lessonId:'egalite',step:0}},ids,100);
  const merged=P.merge(newer,older,ids);assert.equal(merged.english,false);assert.equal(merged.resume.lessonId,'devise');assert.equal(merged.resume.step,2);
});
test('guest and account storage keys are distinct',()=>{
  assert.notEqual(P.key(null),P.key('a'));assert.notEqual(P.key('a'),P.key('b'));
});
